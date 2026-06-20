const PRODUCT_FORM_LABELS = {
  BB: "Hardback",
  BH: "Board book",
  BK: "Hardback",
  BC: "Paperback",
  BP: "Paperback",
  BE: "Spiral bound",
  DG: "eBook",
  EB: "eBook",
  ED: "eBook",
  EA: "eBook",
  AC: "Audiobook",
  ZZ: "Book",
};

const PRODUCT_FORM_DETAIL_LABELS = {
  E101: "EPUB",
  E104: "PDF",
  E107: "PDF",
  E116: "Kindle",
};

/**
 * Human-readable format label from ONIX productForm (+ optional detail / ebookCategories).
 */
export function getProductFormLabel(book) {
  const form = book?.descriptiveDetail?.productForm;
  const detail = book?.descriptiveDetail?.productFormDetail;
  const ebookCat = book?.ebookCategories?.[0];

  if (ebookCat) return ebookCat;
  if (detail && PRODUCT_FORM_DETAIL_LABELS[detail]) {
    const base = PRODUCT_FORM_LABELS[form] || "eBook";
    return `${base} (${PRODUCT_FORM_DETAIL_LABELS[detail]})`;
  }
  if (form && PRODUCT_FORM_LABELS[form]) return PRODUCT_FORM_LABELS[form];
  if (book?.type === "ebook") return "eBook";
  return form || "Book";
}

export default PRODUCT_FORM_LABELS;
