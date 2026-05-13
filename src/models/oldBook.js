import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model("Book", BookSchema);
