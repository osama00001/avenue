import { saveSiteContentMedia } from "@/lib/siteContentMedia";
import { normalizeStoredMedia, pickImageUrl } from "@/lib/mediaUrl";
import { cmsPageSlug } from "@/lib/footerHref";
import {
  getSiteSection,
  saveSiteSection,
  listSitePages,
  getSitePageById,
  createSitePage,
  updateSitePage,
  deleteSitePage,
  listSiteSocialLinks,
  saveSiteSocialLinks,
  normalizeSectionData,
  slugify,
} from "@/lib/siteContentStore";

export const SITE_CONTENT_SINGLES = {
  footer: {
    apiName: "footer",
    title: "Footer",
    description: "Footer columns and links",
  },
  "home-banner": {
    apiName: "home-banner",
    title: "Hero Banner Slider",
    description: "Homepage hero carousel slides",
    kind: "slides",
  },
  "home-promo": {
    apiName: "home-promo",
    title: "Bestsellers Promo Slider",
    description: "Homepage promo carousel",
    kind: "slides",
  },
  "home-strip": {
    apiName: "home-strip",
    title: "Coming Soon Banner",
    description: "Homepage strip banner",
    kind: "banner",
  },
  "home-main-banner": {
    apiName: "home-main-banner",
    title: "Non-Fiction Banner",
    description: "Homepage non-fiction category banner",
    kind: "banner",
  },
  "home-middle-banner": {
    apiName: "home-middle-banner",
    title: "Children's Banner",
    description: "Homepage children's category banner",
    kind: "banner",
  },
  "home-bottom-banner": {
    apiName: "home-bottom-banner",
    title: "Bottom Banner",
    description: "Homepage bottom banner",
    kind: "banner",
  },
  "home-quick-links": {
    apiName: "home-quick-links",
    title: "Quick Links",
    description: "You may be looking for section",
    kind: "quick-links",
  },
  navigation: {
    apiName: "navigation",
    title: "Navigation",
    description: "Header menus",
    kind: "navigation",
  },
  "site-settings": {
    apiName: "site-settings",
    title: "Site Settings",
    description: "Logo and global settings",
    kind: "site-settings",
  },
};

export function getEntryId(entry) {
  if (!entry) return null;
  return entry.id ?? entry._id?.toString?.() ?? null;
}

export function normalizeMedia(media) {
  return normalizeStoredMedia(media);
}

function normalizeFooterLink(link = {}) {
  const href = cmsPageSlug(link.href ?? link.url ?? "");
  return {
    id: link.id ?? null,
    label: link.label ?? "",
    href,
    url: href,
    openInNewTab: Boolean(link.openInNewTab),
  };
}

function normalizeSlide(slide = {}) {
  const image = normalizeStoredMedia(slide.image);
  return {
    id: slide.id ?? null,
    title: slide.title ?? "",
    subtitle: slide.subtitle ?? "",
    href: slide.href ?? "",
    alt: slide.alt ?? "",
    order: slide.order ?? 0,
    image,
    imageId: image?.id ?? null,
  };
}

function normalizeQuickLink(item = {}) {
  const image = normalizeStoredMedia(
    item.image || (item.imageUrl ? { url: item.imageUrl, id: item.imageId } : null)
  );
  return {
    id: item.id ?? null,
    label: item.label ?? "",
    href: item.href ?? "",
    alt: item.alt ?? "",
    order: item.order ?? 0,
    isFeatured: item.isFeatured === true,
    image,
    imageId: image?.id ?? item.imageId ?? null,
    imageUrl: pickImageUrl(item.image) || image?.url || item.imageUrl || null,
  };
}

function normalizeBannerFields(attrs = {}) {
  const image = normalizeStoredMedia(attrs.image);
  return {
    title: attrs.title ?? "",
    subtitle: attrs.subtitle ?? "",
    href: attrs.href ?? "",
    alt: attrs.alt ?? "",
    image,
    imageId: image?.id ?? null,
  };
}

export function normalizeContentEntry(entry) {
  if (!entry) return null;

  const id = getEntryId(entry);
  const source = entry.attributes ?? entry;
  const data = { ...source };
  delete data._id;

  if (Array.isArray(data.slides)) {
    data.slides = data.slides.map(normalizeSlide);
  }
  if (Array.isArray(data.items)) {
    data.items = data.items.map(normalizeQuickLink);
  }
  if (Array.isArray(data.columns)) {
    data.columns = data.columns.map((col) => ({
      ...col,
      links: (col.links || []).map(normalizeFooterLink),
    }));
  }
  if (data.logo !== undefined) {
    data.logo = normalizeStoredMedia(data.logo);
  }
  if (data.image !== undefined && !data.slides && !data.items) {
    const banner = normalizeBannerFields(data);
    return { id, ...banner };
  }

  return { id, ...data };
}

export function normalizeContentList(entries = []) {
  return entries.map((entry) => normalizeContentEntry(entry));
}

function stripImageForWrite(image) {
  if (!image) return null;
  if (typeof image === "string") return { url: image };
  if (image.url) return { url: image.url, id: image.id ?? null, name: image.name ?? null };
  return null;
}

function prepareSlideForWrite(slide = {}) {
  const image = resolveStoredImageForWrite(slide);
  return {
    id: slide.id,
    title: slide.title ?? "",
    subtitle: slide.subtitle ?? "",
    href: slide.href ?? "",
    alt: slide.alt ?? "",
    order: slide.order ?? 0,
    ...(image ? { image } : {}),
  };
}

function resolveStoredImageForWrite(item = {}) {
  const direct = stripImageForWrite(item.image);
  if (direct) return direct;

  const fromUrl = stripImageForWrite(item.imageUrl);
  if (fromUrl) return fromUrl;

  if (item.imageId) {
    const id = String(item.imageId).trim();
    if (id) {
      return stripImageForWrite({
        id,
        url: id.startsWith("/") ? id : `/uploads/site-content/${id}`,
      });
    }
  }

  return null;
}

function resolveQuickLinkImageForWrite(item = {}) {
  return resolveStoredImageForWrite(item);
}

function prepareQuickLinkForWrite(item = {}) {
  const image = resolveQuickLinkImageForWrite(item);
  const label = item.label ?? "";
  return {
    id: item.id,
    label,
    href: item.href ?? "",
    alt: item.alt ?? "",
    order: item.order ?? 0,
    isFeatured: item.isFeatured === true || /must-read/i.test(label),
    ...(image ? { image } : {}),
  };
}

function prepareBannerForWrite(data = {}) {
  const image = resolveStoredImageForWrite(data);
  return {
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    href: data.href ?? "",
    alt: data.alt ?? "",
    ...(image ? { image } : {}),
  };
}

export function prepareSinglePayload(key, body = {}) {
  const config = SITE_CONTENT_SINGLES[key];
  if (!config) return null;

  switch (config.kind) {
    case "slides":
      return {
        slides: (body.slides || []).map(prepareSlideForWrite),
      };
    case "quick-links":
      return {
        items: (body.items || []).map(prepareQuickLinkForWrite),
      };
    case "banner":
      return prepareBannerForWrite(body);
    default:
      if (key === "footer") {
        return {
          columns: (body.columns || []).map((col) => ({
            id: col.id,
            title: col.title ?? "",
            links: (col.links || []).map((link) => ({
              id: link.id,
              label: link.label ?? "",
              url: cmsPageSlug(link.href ?? link.url ?? ""),
              openInNewTab: Boolean(link.openInNewTab),
            })),
          })),
        };
      }
      return body;
  }
}

export async function fetchSiteContentSingle(key) {
  if (!SITE_CONTENT_SINGLES[key]) {
    throw new Error(`Unknown site content section: ${key}`);
  }
  const section = await getSiteSection(key);
  return normalizeContentEntry(section || {});
}

export async function saveSiteContentSingle(key, body) {
  if (!SITE_CONTENT_SINGLES[key]) {
    throw new Error(`Unknown site content section: ${key}`);
  }
  const payload = prepareSinglePayload(key, body);
  const saved = await saveSiteSection(key, payload);
  return normalizeContentEntry(saved);
}

export async function fetchSiteContentPages() {
  const pages = await listSitePages();
  return normalizeContentList(pages);
}

export async function fetchSiteContentPage(id) {
  const page = await getSitePageById(id);
  if (!page) throw new Error("Page not found");
  return normalizeContentEntry(page);
}

export async function createSiteContentPage(body) {
  const page = await createSitePage(body);
  return normalizeContentEntry(page);
}

export async function updateSiteContentPage(id, body) {
  const page = await updateSitePage(id, body);
  return normalizeContentEntry(page);
}

export async function removeSiteContentPage(id) {
  await deleteSitePage(id);
}

export async function fetchSiteContentSocialLinks() {
  const links = await listSiteSocialLinks();
  return normalizeContentList(links);
}

export async function saveSiteContentSocialLinks(links = []) {
  const saved = await saveSiteSocialLinks(links);
  return normalizeContentList(saved);
}

export async function uploadSiteContentImage(input) {
  if (input?.buffer) {
    const uploaded = await saveSiteContentMedia({
      buffer: input.buffer,
      filename: input.filename || "upload.jpg",
      mimeType: input.mimeType || "image/jpeg",
    });
    return normalizeStoredMedia(uploaded);
  }

  const { base64, filename, mimeType } = input || {};
  if (!base64) {
    throw new Error("base64 is required");
  }

  const buffer = Buffer.from(base64, "base64");
  const uploaded = await saveSiteContentMedia({
    buffer,
    filename: filename || "upload.jpg",
    mimeType: mimeType || "image/jpeg",
  });
  return normalizeStoredMedia(uploaded);
}

export function getSiteContentManifest() {
  return {
    sections: Object.entries(SITE_CONTENT_SINGLES)
      .filter(([key]) => !["navigation", "site-settings"].includes(key))
      .map(([key, config]) => ({
        key,
        title: config.title,
        description: config.description,
        kind: config.kind || "custom",
      })),
    collections: [
      {
        key: "pages",
        title: "CMS Pages",
        description: "Terms, privacy, and other content pages",
      },
      {
        key: "social-links",
        title: "Social Links",
        description: "Footer and header social media links",
      },
    ],
  };
}

export { slugify, normalizeSectionData };
