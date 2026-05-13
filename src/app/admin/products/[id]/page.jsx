"use client";

import { formatPublishingDate } from "@/lib/formatData";
import { fetchAdminBookDetails } from "@/store/productSlice";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-sm border p-6">{children}</div>
);

const Chip = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
    {children}
  </span>
);

const ProductDetails = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();

  const { selectedBook } = useSelector((state) => state.products);

  useEffect(() => {
    if (id) dispatch(fetchAdminBookDetails(id));
  }, [id, dispatch]);

  if (!selectedBook) return <div className="p-12 text-center">Loading…</div>;

  const title = selectedBook.descriptiveDetail?.titles?.[0]?.text;
  const author = selectedBook.descriptiveDetail?.contributors?.find(
    (c) => c.role === "A01"
  )?.nameInverted;

  const description = selectedBook.collateralDetail?.textContents?.find(
    (t) => t.textType === "02"
  )?.text;

  const price = selectedBook.productSupply?.prices?.[0];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* HERO */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                {title}
              </h1>

              <p className="text-gray-600 mb-4">
                by {author || "Unknown Author"}
              </p>

              <div className="flex flex-wrap gap-2">
                <Chip>{selectedBook.type}</Chip>
                <Chip>{selectedBook.status ? "Active" : "Disabled"}</Chip>
                <Chip>ISBN: {selectedBook.productIdentifiers?.[0]?.value}</Chip>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border cursor-pointer rounded-lg hover:bg-gray-50"
              >
                Back
              </button>

              {/* <button
                onClick={() =>
                  router.push(`/admin/products/edit/${id}`)
                }
                className="px-5 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              >
                Edit
              </button> */}
            </div>
          </div>
        </Card>

        {/* MAIN GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <h2 className="font-semibold text-lg mb-4">Description</h2>

              <div
                className="text-gray-700 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{
                  __html: description || "No description",
                }}
              />
            </Card>

            <Card>
              <h2 className="font-semibold text-lg mb-4">Categories</h2>

              <div className="flex flex-wrap gap-2">
                {selectedBook.categories?.map((cat) =>
                  cat.schemes.map((s) => (
                    <Chip key={s.scheme}>
                      {cat.code} — {s.headingText}
                    </Chip>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <Card>
              <h2 className="font-semibold text-lg mb-4">Publishing</h2>

              <Info
                label="Publisher"
                value={selectedBook.publishingDetail?.publisher?.name}
              />
              <Info
                label="Imprint"
                value={selectedBook.publishingDetail?.imprint?.name}
              />
              <Info
                label="Date"
                value={formatPublishingDate(
                  selectedBook.publishingDetail?.publishingDate
                )}
              />
            </Card>

            <Card>
              <h2 className="font-semibold text-lg mb-4">Supply</h2>

              <Info
                label="Supplier"
                value={selectedBook.productSupply?.supplier?.name}
              />
              <Info
                label="Availability"
                value={selectedBook.productSupply?.availability}
              />
              <Info
                label="Price"
                value={
                  price
                    ? // ? `${price.amount} ${price.currency}`
                      `£${price.amount}`
                    : "-"
                }
              />
            </Card>

            <Card>
              <h2 className="font-semibold text-lg mb-4">Technical</h2>

              <Info
                label="Language"
                value={selectedBook.descriptiveDetail?.languages?.[0]?.code}
              />
              <Info
                label="Format"
                value={selectedBook.descriptiveDetail?.productForm}
              />
              <Info
                label="Protection"
                value={selectedBook.descriptiveDetail?.epubTechnicalProtection}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Info Row
const Info = ({ label, value }) => (
  <div className="flex justify-between text-sm mb-2">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value || "-"}</span>
  </div>
);

export default ProductDetails;
