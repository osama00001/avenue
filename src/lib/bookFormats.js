import { getProductFormLabel } from "@/lib/productFormLabels";

export const DISPLAY_FORMATS = [
  { key: "special", label: "Special" },
  { key: "hardcover", label: "Hardcover" },
  { key: "paperback", label: "Paperback" },
  { key: "ebook", label: "eBook" },
  { key: "large_print", label: "Large Print" },
];

const EBOOK_FORMS = new Set(["DG", "EB", "ED", "EA"]);
const PAPERBACK_FORMS = new Set(["BC", "BP"]);
const HARDCOVER_FORMS = new Set(["BB", "BH", "BK"]);

/**
 * Maps a book document to one of the five display format keys.
 */
export function getBookDisplayFormatKey(book) {
  const form = book?.descriptiveDetail?.productForm;
  const label = getProductFormLabel(book).toLowerCase();

  if (
    book?.ebookCategories?.[0] ||
    book?.type === "ebook" ||
    (form && EBOOK_FORMS.has(form)) ||
    /ebook|epub|kindle|pdf/.test(label)
  ) {
    return "ebook";
  }

  if ((form && PAPERBACK_FORMS.has(form)) || label.includes("paperback")) {
    return "paperback";
  }

  if (
    (form && HARDCOVER_FORMS.has(form)) ||
    /hardback|hardcover|board/.test(label)
  ) {
    return "hardcover";
  }

  if (label.includes("large print")) {
    return "large_print";
  }

  if (label.includes("special")) {
    return "special";
  }

  return "paperback";
}
