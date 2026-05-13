import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getGuestCart, setGuestCart } from "@/lib/guestCart";
import Cart from "@/models/Cart";
import Book from "@/models/Book";
import { getServerUser } from "@/lib/getServerUser";

/**
 * ===============================
 * POPULATE HELPER
 * ===============================
 */
const populateGuest = async (guestCart) => {
  const books = await Book.find({
    _id: { $in: guestCart.items.map((i) => i.bookId) },
  }).lean();

  const map = {};
  books.forEach((b) => (map[b._id] = b));

  return {
    items: guestCart.items.map((i) => ({
      book: map[i.bookId],
      quantity: i.quantity,
      ebookFormat: i.ebookFormat || null,
    })),
  };
};

/**
 * =====================================
 * GET CART
 * =====================================
 */
export async function GET() {
  await connectDB();

  const user = await getServerUser();

  if (user) {
    const cart = await Cart.findOne({ user: user.id })
      .populate("items.book")
      .lean();

    return NextResponse.json(cart || { items: [] });
  }

  const guestCart = await getGuestCart();
  return NextResponse.json(await populateGuest(guestCart));
}

/**
 * =====================================
 * ADD ITEM
 * =====================================
 */
export async function POST(req) {
  await connectDB();

  const { bookId, quantity = 1, ebookFormat = null } = await req.json();

  const user = await getServerUser();

  // ================= VALIDATION =================
  if (!bookId)
    return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

  if (quantity <= 0)
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const book = await Book.findById(bookId).lean();

  if (!book)
    return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const priceSnapshot = book.productSupply?.prices?.[0]?.amount || 0;

  const currency = book.productSupply?.prices?.[0]?.currency || "GBP";

  // =====================================================
  // LOGGED IN USER CART
  // =====================================================
  if (user) {
    let cart = await Cart.findOne({ user: user.id });

    if (!cart) {
      cart = new Cart({
        user: user.id,
        items: [],
      });
    }

    const existing = cart.items.find(
      (i) =>
        i.book.toString() === bookId && (i.ebookFormat || null) === ebookFormat
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        book: bookId,
        quantity,
        ebookFormat,
        priceSnapshot,
        currency,
      });
    }

    await cart.save();
    await cart.populate("items.book");

    return NextResponse.json({
      items: cart.items,
    });
  }

  // =====================================================
  // GUEST CART
  // =====================================================
  const guestCart = await getGuestCart();

  const existing = guestCart.items.find(
    (i) => i.bookId === bookId && (i.ebookFormat || null) === ebookFormat
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    guestCart.items.push({
      bookId,
      quantity,
      ebookFormat,
    });
  }

  await setGuestCart(guestCart);

  const populated = await populateGuest(guestCart);

  return NextResponse.json({
    items: populated.items,
  });
}

/**
 * =====================================
 * UPDATE QUANTITY
 * =====================================
 */
export async function PUT(req) {
  await connectDB();

  const { bookId, quantity, ebookFormat = null } = await req.json();
  const user = await getServerUser();

  if (user) {
    const cart = await Cart.findOne({ user: user.id });
    if (!cart) return NextResponse.json({ items: [] });

    const item = cart.items.find(
      (i) => i.book.toString() === bookId && i.ebookFormat === ebookFormat
    );

    if (!item) return NextResponse.json(cart);

    if (quantity <= 0)
      cart.items = cart.items.filter((i) => i.book.toString() !== bookId);
    else item.quantity = quantity;

    await cart.save();
    await cart.populate("items.book");

    return NextResponse.json(cart);
  }

  // 🔹 GUEST
  const guestCart = await getGuestCart();

  guestCart.items = guestCart.items
    .map((i) =>
      i.bookId === bookId && i.ebookFormat === ebookFormat
        ? { ...i, quantity }
        : i
    )
    .filter((i) => i.quantity > 0);

  await setGuestCart(guestCart);
  return NextResponse.json(await populateGuest(guestCart));
}

/**
 * =====================================
 * DELETE ITEM
 * =====================================
 */
// export async function DELETE(req) {
//   await connectDB();

//   try {
//     const { bookId, ebookFormat = null } = await req.json();

//     if (!bookId) {
//       return NextResponse.json({ error: "bookId required" }, { status: 400 });
//     }

//     const user = await getServerUser();

//     /**
//      * ===============================
//      * AUTH USER CART
//      * ===============================
//      */
//     if (user) {
//       const cart = await Cart.findOne({ user: user.id });

//       if (!cart) {
//         return NextResponse.json({ items: [] });
//       }

//       cart.items = cart.items.filter((item) => {
//         const sameBook = item.book.toString() === bookId;

//         const sameFormat = (item.ebookFormat || null) === ebookFormat;

//         // Remove ONLY exact match
//         return !(sameBook && sameFormat);
//       });

//       await cart.save();
//       await cart.populate("items.book");

//       return NextResponse.json({ items: cart.items });
//     }

//     /**
//      * ===============================
//      * GUEST CART
//      * ===============================
//      */
//     const guestCart = (await getGuestCart()) || { items: [] };

//     guestCart.items = guestCart.items.filter((item) => {
//       const sameBook = item.bookId === bookId;
//       const sameFormat = (item.ebookFormat || null) === ebookFormat;

//       return !(sameBook && sameFormat);
//     });

//     await setGuestCart(guestCart);

//     const populated = await populateGuest(guestCart);

//     return NextResponse.json({ items: populated.items });
//   } catch (err) {
//     console.error("Cart DELETE Error:", err);

//     return NextResponse.json(
//       { error: "Failed to delete item" },
//       { status: 500 }
//     );
//   }
// }

export async function DELETE(req) {
  await connectDB();

  try {
    const { bookId } = await req.json();

    if (!bookId) {
      return NextResponse.json({ error: "bookId required" }, { status: 400 });
    }

    const user = await getServerUser();

    /**
     * ===============================
     * AUTH USER CART
     * ===============================
     */
    if (user) {
      const cart = await Cart.findOne({ user: user.id });

      if (!cart) {
        return NextResponse.json({ items: [] });
      }

      // ⭐ Remove ALL entries of this book
      cart.items = cart.items.filter((item) => item.book.toString() !== bookId);

      await cart.save();
      await cart.populate("items.book");

      return NextResponse.json({ items: cart.items });
    }

    /**
     * ===============================
     * GUEST CART
     * ===============================
     */
    const guestCart = (await getGuestCart()) || { items: [] };

    guestCart.items = guestCart.items.filter((item) => item.bookId !== bookId);

    await setGuestCart(guestCart);

    const populated = await populateGuest(guestCart);

    return NextResponse.json({ items: populated.items });
  } catch (err) {
    console.error("Cart DELETE Error:", err);

    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
