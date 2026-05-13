import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import Cart from "@/models/Cart";
import Book from "@/models/Book";
import { getServerUser } from "@/lib/getServerUser";

export async function POST() {
  await connectDB();

  const user = await getServerUser();
  if (!user) return NextResponse.json({ merged: false });

  const guestCart = await getGuestCart();
  if (!guestCart.items?.length) return NextResponse.json({ merged: false });

  // Fetch all books in ONE query
  const books = await Book.find({
    _id: { $in: guestCart.items.map((i) => i.bookId) },
  }).lean();

  const bookMap = {};
  books.forEach((b) => (bookMap[b._id] = b));

  let cart = await Cart.findOne({ user: user.id });

  if (!cart) {
    cart = new Cart({ user: user.id });
  }

  /**
   * Merge items using schema helper
   */
  guestCart.items.forEach(({ bookId, quantity, ebookFormat }) => {
    const book = bookMap[bookId];
    if (!book) return; // skip invalid

    cart.addItem({
      book: bookId,
      quantity,
      ebookFormat: ebookFormat || null,
      priceSnapshot: book.productSupply?.prices?.[0]?.amount,
      currency: book.productSupply?.prices?.[0]?.currency,
    });
  });

  await cart.save();
  await clearGuestCart();

  await cart.populate("items.book");

  return NextResponse.json({
    success: true,
    cart,
  });
}
