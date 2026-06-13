"use client";

import ProductSlider from "@/components/ProductSlider";
import BookDetail from "@/components/BookDetail";
import { useState, useEffect, use } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSingleBook } from "@/store/bookSlice";
import { notFound } from "next/navigation";
import reverseName from "@/lib/reverseName";

export default function BookPage({ params }) {
  const { id } = use(params);

  const dispatch = useDispatch();
  const { books, loading } = useSelector((state) => state.book);
  const [book, setBook] = useState([]);

  useEffect(() => {
    dispatch(fetchSingleBook(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (books) {
      const updatedBook = books.map((item, index) => ({
        ...item,
        author: reverseName(
          item.descriptiveDetail?.contributors?.find(c => c.role === "A01")?.nameInverted
          || item.descriptiveDetail?.contributors?.[0]?.nameInverted
          || ""
        ),
        image: item.coverImage || `/covers/${item.recordReference.split("_")[0] || ""}.jpg`,
        format: "Paperback",
        preorder: false,
      }));
      setBook(updatedBook);
    }
  }, [books]);

  if (!book) {
    notFound();
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-10">
      <BookDetail book={book[0]} />

      <div className="max-w-7xl mx-auto px-4">
        <ProductSlider
          title="Recently Reviewed"
          seeMoreUrl="/books"
          products={book}
          slidesPerView={5}
          autoplayDelay={2500}
          showArrows
          showDots={false}
          loop
        />
      </div>
    </div>
  );
}
