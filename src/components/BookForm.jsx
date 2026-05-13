"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { BookOpen, Save } from "lucide-react";

export default function BookForm({ book, onSubmitSuccess }) {
  const { register, handleSubmit } = useForm({
    defaultValues: book || {}
  });

  const onSubmit = async (data) => {
    if (book?._id) {
      await axios.put(`/api/admin/books/${book._id}`, data);
    } else {
      await axios.post("/api/admin/books", data);
    }
    onSubmitSuccess();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      
      {/* Header */}
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
        <BookOpen size={30} className="text-blue-600" />
        {book ? "Edit Book" : "Add New Book"}
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Title */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium">Title</label>
          <Input
            className="focus:ring-2 focus:ring-blue-400"
            placeholder="Enter book title"
            {...register("title")}
            required
          />
        </div>

        {/* ISBN */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium">ISBN</label>
          <Input
            className="focus:ring-2 focus:ring-blue-400"
            placeholder="Enter ISBN"
            {...register("isbn")}
            required
          />
        </div>

        {/* Author */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium">Author</label>
          <Input
            className="focus:ring-2 focus:ring-blue-400"
            placeholder="Enter author name"
            {...register("author")}
            required
          />
        </div>

        {/* Price */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium">Price</label>
          <Input
            type="number"
            className="focus:ring-2 focus:ring-blue-400"
            placeholder="Enter price"
            {...register("price")}
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col space-y-2">
          <label className="text-gray-700 font-medium">Description</label>
          <textarea
            className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800"
            placeholder="Enter description..."
            {...register("description")}
          ></textarea>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg rounded-lg shadow-md transition-all"
        >
          <Save size={20} />
          {book ? "Update Book" : "Create Book"}
        </Button>

      </form>
    </div>
  );
}
