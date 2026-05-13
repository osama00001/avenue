import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

export async function GET() {
  await connectDB();
  const books = await Book.find().limit(10);
  return Response.json(books);
}

export async function POST(request) {
  await connectDB();
  const data = await request.json();
  const book = await Book.create(data);
  return Response.json(book);
}

/**
 * Detect ebook vs physical book based on ONIX ProductForm
 */
const EBOOK_FORMS = ["DG", "EB", "ED", "EA"];

export async function PUT() {
  try {
    await connectDB();

    /**
     * STEP 0
     * Remove invalid enum values (VERY IMPORTANT)
     */
    await Book.updateMany({ type: null }, { $unset: { type: "" } });

    /**
     * STEP 1
     * Set all EBOOKS
     */
    await Book.updateMany(
      {
        "descriptiveDetail.productForm": { $in: EBOOK_FORMS },
      },
      {
        $set: {
          type: "ebook",
          status: true,
        },
      }
    );

    /**
     * STEP 2
     * Set all PHYSICAL BOOKS
     */
    await Book.updateMany(
      {
        "descriptiveDetail.productForm": { $nin: EBOOK_FORMS },
      },
      {
        $set: {
          type: "book",
          status: true,
          ebookCategories: [],
        },
      }
    );

    /**
     * STEP 3
     * Reset ebookCategories for ebooks
     * (important to avoid stale data)
     */
    await Book.updateMany({ type: "ebook" }, { $set: { ebookCategories: [] } });

    /**
     * STEP 4
     * EPUB
     */
    await Book.updateMany(
      {
        type: "ebook",
        "descriptiveDetail.productFormDetail": "E101",
      },
      {
        $addToSet: { ebookCategories: "EPUB" },
      }
    );

    /**
     * STEP 5
     * PDF
     */
    await Book.updateMany(
      {
        type: "ebook",
        "descriptiveDetail.productFormDetail": "E104",
      },
      {
        $addToSet: { ebookCategories: "PDF" },
      }
    );

    /**
     * STEP 6
     * KINDLE
     */
    await Book.updateMany(
      {
        type: "ebook",
        "descriptiveDetail.productForm": "EA",
      },
      {
        $addToSet: { ebookCategories: "KINDLE" },
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Book type and ebook categories updated correctly",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("BOOK TYPE UPDATE ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
