import Book from "@/models/Book";

const FREE_SHIPPING_PENCE = 2500; // £25.00
const STANDARD_SHIPPING_PENCE = 299; // £2.99

function linePricePence(book, quantity = 1) {
  const priceObj = book.productSupply?.prices?.[0] || {};
  const amount = Number(priceObj.amount) || 0;
  const discount = Number(priceObj.discountPercent) || 0;
  const finalPrice = discount > 0 ? amount - (amount * discount) / 100 : amount;
  return Math.round(finalPrice * 100) * (quantity || 1);
}

/**
 * Server-side cart pricing — single source of truth for Stripe + order create.
 * @param {Array<{ bookId: string, quantity: number, ebookFormat?: string|null }>} cart
 */
export async function computeOrderPricing(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart is empty");
  }

  let subtotalPence = 0;
  let currency = "gbp";
  const lineItems = [];

  for (const entry of cart) {
    const book = await Book.findById(entry.bookId).lean();
    if (!book) continue;

    const priceObj = book.productSupply?.prices?.[0] || {};
    const amount = Number(priceObj.amount) || 0;
    const discount = Number(priceObj.discountPercent) || 0;
    const finalPrice =
      discount > 0 ? amount - (amount * discount) / 100 : amount;
    const qty = entry.quantity || 1;
    const linePence = linePricePence(book, qty);

    subtotalPence += linePence;
    currency = (priceObj.currency || "GBP").toLowerCase();

    lineItems.push({
      bookId: String(book._id),
      title: book.descriptiveDetail?.titles?.[0]?.text || "Untitled",
      type: book.type || "book",
      price: Number(finalPrice.toFixed(2)),
      currency: priceObj.currency || "GBP",
      quantity: qty,
      ebookFormat: entry.ebookFormat || null,
      linePence,
    });
  }

  if (!lineItems.length) {
    throw new Error("No valid items priced");
  }

  const shippingPence =
    subtotalPence >= FREE_SHIPPING_PENCE ? 0 : STANDARD_SHIPPING_PENCE;
  const totalPence = subtotalPence + shippingPence;

  return {
    subtotalPence,
    shippingPence,
    totalPence,
    subtotal: Number((subtotalPence / 100).toFixed(2)),
    shippingCost: Number((shippingPence / 100).toFixed(2)),
    total: Number((totalPence / 100).toFixed(2)),
    currency,
    lineItems,
  };
}

export { FREE_SHIPPING_PENCE, STANDARD_SHIPPING_PENCE };
