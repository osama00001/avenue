"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  deleteCategory,
  fetchCategoryById,
  updateCategory,
} from "@/store/categorySlice";
import CategorySchemeForm from "./CategorySchemeForm";
import AdminHeader from "@/components/admin/AdminHeader";

const CategoryDetailsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const scheme = searchParams.get("scheme");

  const { selectedCategory, selectedLoading, selectedError } = useSelector(
    (state) => state.category
  );

  useEffect(() => {
    if (id && scheme) {
      dispatch(fetchCategoryById({ id, scheme }));
    }
  }, [id, scheme, dispatch]);

  // 🔄 loading
  if (selectedLoading) {
    return <div className="p-6 text-gray-500">Loading category…</div>;
  }

  // ❌ error
  if (selectedError) {
    return <div className="p-6 text-red-500">{selectedError}</div>;
  }

  // ❗ nothing loaded yet
  if (!selectedCategory) {
    return <div className="p-6">No data found</div>;
  }

  //   const row = selectedCategory;

  console.log("-=-=- selectedCategory -=-=-=-", selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header */}
        <AdminHeader title="Category Details" />

        {/* Card */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Scheme Information
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Update category scheme details or disable/delete it.
            </p>
          </div>

          {/* Card Body */}
          <div className="px-6 py-8 flex cursor-pointer justify-center">
            {/* ✅ Centered form wrapper */}
            <div className="w-full max-w-xl">
              <CategorySchemeForm
                initialData={selectedCategory}
                onSubmit={(values) => {
                  dispatch(
                    updateCategory({
                      id: selectedCategory._id,
                      scheme: selectedCategory.scheme?.scheme,
                      headingText: values.headingText,
                      status: values.status,
                    })
                  );

                  router.back();
                }}
                onDelete={() => {
                  dispatch(
                    deleteCategory({
                      id: selectedCategory._id,
                      scheme: selectedCategory.scheme,
                    })
                  );
                  router.back();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailsPage;
