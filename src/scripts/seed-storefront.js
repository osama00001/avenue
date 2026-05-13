/**
 * seed-storefront.js
 *
 * One-shot script to seed the minimum content the storefront needs to look
 * alive after deployment:
 *   - 9 CMS pages grouped into the 3 footer columns (Shopping / Legal / About)
 *   - 5 social-media link placeholders (Katie can flip enabled=false later)
 *
 * Idempotent — re-running updates existing rows by slug instead of duplicating.
 *
 * Run:
 *   node --env-file=.env.local src/scripts/seed-storefront.js
 *
 * Add --reset to wipe and re-seed (use only when intentional):
 *   node --env-file=.env.local src/scripts/seed-storefront.js --reset
 */

import 'dotenv/config';
import { connectDB }   from '../lib/db.js';
import CmsPage         from '../models/CmsPage.js';
import SocialMedia     from '../models/SocialMedia.js';

const RESET = process.argv.includes('--reset');

// ---------------------------------------------------------------------------
// CMS PAGES — minimum legal & support set for a UK e-commerce site.
// `level` matches the Footer's column groups (1=Shopping, 2=Legal, 3=About).
// `blocks` use type 'richtext' which Next renders via the cms slug page;
// content is intentionally placeholder so Katie can replace it without it
// looking broken in the meantime.
// ---------------------------------------------------------------------------
const CMS_PAGES = [
  // SHOPPING WITH US (level 1)
  {
    slug: 'delivery',
    title: 'Delivery & Shipping',
    level: 1,
    blocks: [{ type: 'richtext', data: {
      html: '<p>UK orders are dispatched within 24 hours of receipt (orders placed after 4pm Mon–Fri ship the next working day). Standard delivery: 2–5 working days. Free on orders over £25; £2.99 below.</p>'
    }}],
  },
  {
    slug: 'returns',
    title: 'Returns',
    level: 1,
    blocks: [{ type: 'richtext', data: {
      html: '<p>You may return any unread book in original condition within 30 days of delivery for a full refund. Email <a href="mailto:hello@avenuebookstore.com">hello@avenuebookstore.com</a> with your order number to start a return.</p>'
    }}],
  },
  {
    slug: 'help',
    title: 'Help & FAQ',
    level: 1,
    blocks: [{ type: 'richtext', data: {
      html: '<p>Find answers to common questions about ordering, delivery, ebooks, and accounts. Need more help? Email <a href="mailto:hello@avenuebookstore.com">hello@avenuebookstore.com</a>.</p>'
    }}],
  },

  // LEGAL (level 2)
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    level: 2,
    blocks: [{ type: 'richtext', data: {
      html: '<p>These terms govern your use of avenuebookstore.com. By placing an order you agree to be bound by them. Avenue Bookstore reserves the right to amend these terms at any time. Last updated 2026.</p><p><em>Placeholder — replace with finalised legal text from your solicitor before launch.</em></p>'
    }}],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    level: 2,
    blocks: [{ type: 'richtext', data: {
      html: '<p>We collect only the data needed to fulfil your order (name, address, email, payment details). We never sell your data. UK GDPR rights apply — contact <a href="mailto:privacy@avenuebookstore.com">privacy@avenuebookstore.com</a> for access, correction, or deletion requests.</p><p><em>Placeholder — replace with your finalised privacy policy.</em></p>'
    }}],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    level: 2,
    blocks: [{ type: 'richtext', data: {
      html: '<p>We use essential cookies for cart and login, and analytics cookies to improve the site. You can manage cookie preferences in your browser settings.</p>'
    }}],
  },

  // ABOUT AVENUE (level 3)
  {
    slug: 'about',
    title: 'About Avenue',
    level: 3,
    blocks: [{ type: 'richtext', data: {
      html: '<p>Avenue Bookstore is an independent UK bookseller offering a curated catalogue of physical and digital titles, sourced through our partnership with Gardners Books — the UK’s largest book wholesaler.</p>'
    }}],
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    level: 3,
    blocks: [{ type: 'richtext', data: {
      html: '<p>Email: <a href="mailto:hello@avenuebookstore.com">hello@avenuebookstore.com</a><br>We respond to all enquiries within one working day.</p>'
    }}],
  },
  {
    slug: 'press',
    title: 'Press',
    level: 3,
    blocks: [{ type: 'richtext', data: {
      html: '<p>Press enquiries: <a href="mailto:press@avenuebookstore.com">press@avenuebookstore.com</a></p>'
    }}],
  },
];

// ---------------------------------------------------------------------------
// SOCIAL LINKS — placeholders. Katie sets real URLs in admin; `enabled: false`
// hides each one until ready. Icons match the Footer's ICON_MAP.
// ---------------------------------------------------------------------------
const SOCIAL_LINKS = [
  { label: 'Instagram', url: 'https://instagram.com/avenuebookstore',  icon: 'faInstagram',     enabled: false, order: 1 },
  { label: 'Facebook',  url: 'https://facebook.com/avenuebookstore',   icon: 'faSquareFacebook',enabled: false, order: 2 },
  { label: 'X',         url: 'https://x.com/avenuebookstore',          icon: 'faXTwitter',      enabled: false, order: 3 },
  { label: 'TikTok',    url: 'https://tiktok.com/@avenuebookstore',    icon: 'faTiktok',        enabled: false, order: 4 },
  { label: 'YouTube',   url: 'https://youtube.com/@avenuebookstore',   icon: 'faYoutube',       enabled: false, order: 5 },
];

// ---------------------------------------------------------------------------
async function run() {
  console.log('[seed] Connecting to MongoDB...');
  await connectDB();
  console.log('[seed] Connected.\n');

  // ── CMS pages ────────────────────────────────────────────────────────────
  if (RESET) {
    const r = await CmsPage.deleteMany({});
    console.log(`[seed] --reset: deleted ${r.deletedCount} CMS pages.`);
  }

  let created = 0, updated = 0;
  for (const page of CMS_PAGES) {
    const existed = await CmsPage.findOne({ slug: page.slug }).lean();
    await CmsPage.updateOne(
      { slug: page.slug },
      { $set: page },
      { upsert: true }
    );
    if (existed) updated++; else created++;
  }
  console.log(`[seed] CMS pages — created ${created}, updated ${updated} (target: ${CMS_PAGES.length}).`);

  // ── Social links ─────────────────────────────────────────────────────────
  if (RESET) {
    await SocialMedia.deleteMany({});
    console.log('[seed] --reset: cleared SocialMedia.');
  }

  // SocialMedia is a single config doc with a `links` array
  const existing = await SocialMedia.findOne({}).lean();
  if (existing && !RESET) {
    // Don't trample real settings — only fill in if the array is empty
    if (!existing.links || existing.links.length === 0) {
      await SocialMedia.updateOne({ _id: existing._id }, { $set: { links: SOCIAL_LINKS } });
      console.log(`[seed] Social links — populated ${SOCIAL_LINKS.length} placeholders into existing doc.`);
    } else {
      console.log(`[seed] Social links — existing doc has ${existing.links.length} links, leaving as-is.`);
    }
  } else {
    await SocialMedia.create({ links: SOCIAL_LINKS });
    console.log(`[seed] Social links — created config doc with ${SOCIAL_LINKS.length} placeholders.`);
  }

  console.log('\n[seed] Done. Refresh the homepage — footer should now have content.');
  process.exit(0);
}

run().catch(err => {
  console.error('[seed] FATAL:', err.stack || err.message);
  process.exit(1);
});
