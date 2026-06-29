/** Resolve stored media URL for admin + storefront. */
export function resolveMediaUrl(url) {
  if (!url) return null;
  let value = String(url).trim();
  if (!value) return null;
  if (value.endsWith(".jp")) {
    value = `${value}g`;
  }
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//")
  ) {
    return value;
  }
  return value.startsWith("/") ? value : `/${value}`;
}

export const getMediaUrl = resolveMediaUrl;

export function normalizeStoredMedia(media) {
  if (!media) return null;
  if (typeof media === "string") {
    return { id: null, url: resolveMediaUrl(media), name: null };
  }
  const url = media.url ?? media.imageUrl ?? null;
  return {
    id: media.id ?? null,
    url: url ? resolveMediaUrl(url) : null,
    name: media.name ?? null,
  };
}

export function pickImageUrl(media) {
  const normalized = normalizeStoredMedia(media);
  return normalized?.url || null;
}

/** Local & CMS paths — use <img> to avoid next/image localPatterns config issues. */
export function shouldUseNativeImage(url) {
  if (!url) return false;
  const value = String(url);
  return (
    value.includes("localhost:1337") ||
    value.includes("127.0.0.1:1337") ||
    value.startsWith("/uploads/") ||
    value.startsWith("/covers/") ||
    value.startsWith("/img/") ||
    value.startsWith("/banner/") ||
    value.includes("/uploads/") ||
    value.includes("/covers/")
  );
}
