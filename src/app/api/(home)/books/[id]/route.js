import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Book from "@/models/Book";
import { connectDB } from "@/lib/db";

export async function GET(_, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        // Reject invalid ObjectIds early — non-ObjectId routes (like
        // /api/books/highlights) accidentally hit this dynamic [id] route
        // and used to throw a CastError, returning a 500 to the client.
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // Also support lookup by ISBN / recordReference as a fallback
            const byRef = await Book.findOne({ recordReference: id }).lean();
            return NextResponse.json(byRef ? [byRef] : []);
        }

        const book = await Book.findById(id).lean();
        return NextResponse.json(book ? [book] : []);
    } catch (err) {
        console.error("[/api/books/[id]] error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
