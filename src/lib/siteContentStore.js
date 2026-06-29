import { connectDB } from "@/lib/db";
import SiteContentSection from "@/models/SiteContentSection";
import CmsPage from "@/models/CmsPage";
import SocialMedia from "@/models/SocialMedia";
import { normalizeStoredMedia, pickImageUrl } from "@/lib/mediaUrl";
import { cmsPageSlug } from "@/lib/footerHref";
import { filterUtilityMenu } from "@/lib/navigation";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_.~]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlide(slide = {}, index = 0) {
  const image = normalizeStoredMedia(slide.image);
  return {
    id: slide.id ?? slide._id?.toString?.() ?? `slide-${index}`,
    title: slide.title ?? "",
    subtitle: slide.subtitle ?? "",
    href: slide.href ?? "",
    alt: slide.alt ?? "",
    order: slide.order ?? index,
    image,
    imageId: image?.id ?? null,
    imageUrl: pickImageUrl(slide.image) || image?.url || null,
  };
}

function normalizeFooterLink(link = {}, index = 0) {
  const href = cmsPageSlug(link.href ?? link.url ?? "");
  return {
    id: link.id ?? link._id?.toString?.() ?? `link-${index}`,
    label: link.label ?? "",
    href,
    url: href,
    openInNewTab: Boolean(link.openInNewTab),
  };
}

function normalizeQuickLink(item = {}, index = 0) {
  const image = normalizeStoredMedia(
    item.image || (item.imageUrl ? { url: item.imageUrl, id: item.imageId } : null)
  );
  return {
    id: item.id ?? item._id?.toString?.() ?? `item-${index}`,
    label: item.label ?? "",
    href: item.href ?? "",
    alt: item.alt ?? "",
    order: item.order ?? index,
    isFeatured: item.isFeatured === true,
    image,
    imageId: image?.id ?? item.imageId ?? null,
    imageUrl: pickImageUrl(item.image) || image?.url || item.imageUrl || null,
  };
}

function normalizeBannerFields(data = {}) {
  const image = normalizeStoredMedia(data.image);
  return {
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    href: data.href ?? "",
    alt: data.alt ?? "",
    image,
    imageId: image?.id ?? null,
    imageUrl: pickImageUrl(data.image) || image?.url || null,
  };
}

export function normalizeSectionData(key, data = {}) {
  const normalized = { ...data };

  if (Array.isArray(normalized.slides)) {
    normalized.slides = normalized.slides.map(normalizeSlide);
  }
  if (Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map(normalizeQuickLink);
  }
  if (Array.isArray(normalized.columns)) {
    normalized.columns = normalized.columns.map((col, colIndex) => ({
      ...col,
      id: col.id ?? `col-${colIndex}`,
      links: (col.links || []).map(normalizeFooterLink),
    }));
  }
  if (normalized.logo !== undefined) {
    normalized.logo = normalizeStoredMedia(normalized.logo);
  }
  if (
    normalized.image !== undefined &&
    !normalized.slides &&
    !normalized.items
  ) {
    return normalizeBannerFields(normalized);
  }

  return normalized;
}

function normalizePageDoc(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    id: plain._id?.toString(),
    title: plain.title ?? "",
    slug: plain.slug ?? "",
    level: plain.level ?? 0,
    content: plain.content ?? "",
    blocks: plain.blocks ?? [],
    publishedAt: plain.publishedAt ?? plain.createdAt ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

export async function getSiteSection(key) {
  await connectDB();
  const doc = await SiteContentSection.findOne({ key }).lean();
  if (!doc) return null;
  return {
    id: doc._id?.toString(),
    key: doc.key,
    ...normalizeSectionData(key, doc.data || {}),
  };
}

export async function saveSiteSection(key, data = {}) {
  await connectDB();
  const doc = await SiteContentSection.findOneAndUpdate(
    { key },
    { $set: { data } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return {
    id: doc._id?.toString(),
    key: doc.key,
    ...normalizeSectionData(key, doc.data || {}),
  };
}

export async function listSitePages() {
  await connectDB();
  const docs = await CmsPage.find({})
    .sort({ level: 1, createdAt: -1 })
    .lean();
  return docs.map(normalizePageDoc);
}

export async function getSitePageById(id) {
  await connectDB();
  const doc = await CmsPage.findById(id).lean();
  return normalizePageDoc(doc);
}

export async function getSitePageBySlug(slug) {
  await connectDB();
  const doc = await CmsPage.findOne({ slug: slugify(slug) }).lean();
  return normalizePageDoc(doc);
}

export async function createSitePage(body = {}) {
  await connectDB();
  const title = String(body.title || "").trim();
  const slug = slugify(body.slug || title);
  if (!title) throw new Error("Title is required");
  if (!slug) {
    throw new Error("A valid slug is required (letters, numbers, and hyphens only)");
  }

  const existing = await CmsPage.findOne({ slug }).lean();
  if (existing) throw new Error(`A page with slug "${slug}" already exists`);

  const doc = await CmsPage.create({
    title,
    slug,
    level: Number(body.level) || 0,
    content: body.content || "",
    publishedAt: new Date(),
  });
  return normalizePageDoc(doc);
}

export async function updateSitePage(id, body = {}) {
  await connectDB();
  const patch = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.content !== undefined) patch.content = body.content;
  if (body.level !== undefined) patch.level = Number(body.level) || 0;
  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (!slug) {
      throw new Error("A valid slug is required (letters, numbers, and hyphens only)");
    }
    patch.slug = slug;
  }
  patch.publishedAt = new Date();

  const doc = await CmsPage.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  if (!doc) throw new Error("Page not found");
  return normalizePageDoc(doc);
}

export async function deleteSitePage(id) {
  await connectDB();
  const doc = await CmsPage.findByIdAndDelete(id).lean();
  if (!doc) throw new Error("Page not found");
  return normalizePageDoc(doc);
}

export async function listSiteSocialLinks() {
  await connectDB();
  const doc = await SocialMedia.findOne({}).lean();
  const links = doc?.links || [];
  return links.map((link, index) => ({
    id: link._id?.toString?.() ?? `social-${index}`,
    label: link.label ?? "",
    url: link.url ?? "",
    icon: link.icon ?? "",
    order: link.order ?? index,
    enabled: link.enabled !== false,
  }));
}

export async function saveSiteSocialLinks(links = []) {
  await connectDB();
  const payload = links.map((link, index) => ({
    label: link.label ?? "",
    url: link.url ?? "",
    icon: link.icon ?? "",
    order: link.order ?? index,
    enabled: link.enabled !== false,
  }));

  const doc = await SocialMedia.findOneAndUpdate(
    {},
    { $set: { links: payload } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return (doc.links || []).map((link, index) => ({
    id: `social-${index}`,
    label: link.label ?? "",
    url: link.url ?? "",
    icon: link.icon ?? "",
    order: link.order ?? index,
    enabled: link.enabled !== false,
  }));
}

/** Storefront shape for single-type section responses */
export async function getPublicSection(key) {
  const section = await getSiteSection(key);
  if (!section) return null;
  const { id, ...rest } = section;
  if (key === "navigation" && Array.isArray(rest.utilityMenu)) {
    rest.utilityMenu = filterUtilityMenu(rest.utilityMenu);
  }
  return { id, attributes: rest, ...rest };
}

export async function getPublicPagesList() {
  const pages = await listSitePages();
  return pages.map((page) => ({
    id: page.id,
    attributes: {
      title: page.title,
      slug: page.slug,
      level: page.level,
    },
    ...page,
  }));
}

export async function getPublicPageBySlug(slug) {
  const page = await getSitePageBySlug(slug);
  if (!page) return null;
  return {
    id: page.id,
    attributes: {
      title: page.title,
      slug: page.slug,
      level: page.level,
      content: page.content,
    },
    ...page,
  };
}

export async function getPublicSocialLinks() {
  const links = await listSiteSocialLinks();
  return links.map((link, index) => ({
    id: link.id ?? `social-${index}`,
    attributes: {
      label: link.label,
      url: link.url,
      icon: link.icon,
      order: link.order,
      enabled: link.enabled,
    },
    ...link,
  }));
}

export { slugify, normalizeSlide, normalizeBannerFields };
