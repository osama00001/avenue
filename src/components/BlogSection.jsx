import { fetchBlogCategories, fetchBlogs } from "@/store/blogSlice";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import BlogCard from "./cards/BlogCards";

export default function BlogSection() {
  const dispatch = useDispatch();
  const { list, categories, loading, categoryLoading } = useSelector(
    (s) => s.blog
  );

  useEffect(() => {
    dispatch(fetchBlogs());
    dispatch(fetchBlogCategories());
  }, [dispatch]);

  return (
    <section className="px-3 mt-10 md:mt-15 mb-10 md:mb-15 pb-10 border-b page-width">
      <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {list.map((blog) => (
          <BlogCard key={blog._id} blog={blog} />
        ))}
      </div>
    </section>
  );
}
