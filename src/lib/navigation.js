/** Hide legacy / unused utility links from storefront nav. */
export function isHiddenUtilityNavItem(item) {
  const label = String(item?.label || "").trim();
  const href = String(item?.href || item?.url || "").trim().toLowerCase();

  if (/(?:shop|store)\s*finder|^help(?:\s*&.*)?$/i.test(label)) {
    return true;
  }

  if (/^events?$|^blog$|^gift\s*cards?$|^win$/i.test(label)) {
    return true;
  }

  return /^\/(?:events|blog|gift-cards|win)(?:\/|$)/.test(href);
}

export function filterUtilityMenu(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isHiddenUtilityNavItem(item));
}
