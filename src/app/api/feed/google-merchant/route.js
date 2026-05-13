/**
 * GET /api/feed/google-merchant
 * Google Merchant Center XML feed.
 *
 * Returns RSS 2.0 / Google Merchant Center format XML.
 * Only includes books where isSellable: true AND status: true.
 * Auto-updates as books sync from Gardners.
 *
 * Submit this URL to Google Merchant Center:
 *   https://avenuebookstore.com/api/feed/google-merchant
 */

import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import Book             from '@/models/Book';

const SITE_URL = process.env.NEXTAUTH_URL || 'https://avenuebookstore.com';

// Map availabilityStatus → Google Merchant availability string
const GMC_AVAILABILITY = {
  in_stock:    'in stock',
  available:   'in stock',
  to_order:    'available for order',
  pod:         'available for order',
  preorder:    'preorder',
  out_of_stock:'out of stock',
  withdrawn:   'out of stock',
  cancelled:   'out of stock',
  unknown:     'out of stock',
};

export async function GET() {
  try {
    await connectDB();

    // Fetch sellable books in batches to build feed.
    // status: { $ne: false } matches `true` and `undefined` — bulk-imported
    // books don't get Mongoose defaults applied, so status is undefined on
    // most of them rather than explicitly true.
    const books = await Book.find(
      { isSellable: true, status: { $ne: false } },
      {
        recordReference:   1,
        productIdentifiers: 1,
        descriptiveDetail: 1,
        collateralDetail:  1,
        productSupply:     1,
        publishingDetail:  1,
        availabilityStatus: 1,
        coverImage:        1,
        categories:        1,
        type:              1,
      }
    )
      .populate('categories', 'schemes')
      .limit(50000)   // GMC typically caps at ~50k items per feed; paginate if needed
      .lean();

    const items = books.map(book => buildItem(book)).filter(Boolean);

    const xml = buildFeed(items);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',  // Cache 1 hour
      },
    });

  } catch (err) {
    console.error('[api/feed/google-merchant] Error:', err.message);
    return NextResponse.json({ error: 'Feed generation failed' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
function buildItem(book) {
  // Extract ISBN-13
  const isbnEntry = (book.productIdentifiers || []).find(p => p.type === '15');
  const isbn13    = isbnEntry?.value;
  if (!isbn13) return null;

  // Title
  const titleEntry = (book.descriptiveDetail?.titles || []).find(t => t.level === '01');
  const title      = escapeXml(titleEntry?.text || '');
  if (!title) return null;

  // Short description (textType 02)
  const shortDesc = (book.collateralDetail?.textContents || []).find(t => t.textType === '02');
  const desc      = escapeXml(stripHtml(shortDesc?.text || ''));

  // Price (prefer GBP)
  const prices    = book.productSupply?.prices || [];
  const gbpPrice  = prices.find(p => p.currency === 'GBP' && p.amount);
  const priceStr  = gbpPrice ? `${gbpPrice.amount.toFixed(2)} GBP` : '';
  if (!priceStr) return null;

  // URLs
  const productUrl = `${SITE_URL}/books/${book.recordReference}`;
  const imageUrl   = book.coverImage
    ? `${SITE_URL}${book.coverImage}`
    : `${SITE_URL}/covers/${isbn13}.jpg`;

  // Availability
  const availability = GMC_AVAILABILITY[book.availabilityStatus] || 'out of stock';

  // Brand (publisher)
  const brand = escapeXml(book.publishingDetail?.publisher?.name || '');

  // Category (first BIC category heading)
  const catScheme = book.categories?.[0]?.schemes?.find(s => s.scheme === '12');
  const productType = escapeXml(catScheme?.headingText || '');

  return `    <item>
      <g:id>${escapeXml(isbn13)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:price>${priceStr}</g:price>
      <g:availability>${availability}</g:availability>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${productType}</g:product_type>
      <g:gtin>${escapeXml(isbn13)}</g:gtin>
    </item>`;
}

// ---------------------------------------------------------------------------
function buildFeed(items) {
  const now = new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Avenue Bookstore</title>
    <link>${SITE_URL}</link>
    <description>Avenue Bookstore product feed</description>
    <lastBuildDate>${now}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>`;
}

// ---------------------------------------------------------------------------
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
