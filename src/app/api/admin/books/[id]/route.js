import { connectDB } from "@/lib/db";
import Book from "@/models/Book";

export async function GET(_, { params }) {
  const { id } = await params;
  await connectDB();
  const book = await Book.findById(id);
  return Response.json(book);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  await connectDB();
  const data = await request.json();
  const book = await Book.findByIdAndUpdate(id, data, { new: true });
  return Response.json(book);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  await connectDB();
  await Book.findByIdAndDelete(id);
  return Response.json({ message: "Book deleted" });
}
