import Image from "next/image";
import React from "react";

const CheckoutItemCard = ({ item }) => {
  const getTitle = (book) =>
    book?.descriptiveDetail?.titles?.[0]?.text || "Untitled";

  const getOriginalPrice = (book) =>
    book?.productSupply?.prices?.[0]?.amount || 0;

  const getDiscountPercent = (book) =>
    book?.productSupply?.prices?.[0]?.discountPercent || 0;

  const getFinalPrice = (book) => {
    const price = getOriginalPrice(book);
    const discount = getDiscountPercent(book);
    return discount ? price - (price * discount) / 100 : price;
  };

  const getAuthor = (book) =>
    reverseName(book?.descriptiveDetail?.contributors?.[0]?.nameInverted) ||
    "Unknown";

  const book = item.book;
  if (!book) return null;

  const title = getTitle(book);
  const price = getFinalPrice(book);
  // const author = getAuthor(book);

  console.log("Checkout item:", item);
  // const title =
  //   item.book?.descriptiveDetail?.titles?.[0]?.text || "Untitled Book";

  // const price = item.book?.productSupply?.prices?.[0]?.amount || 0;
  //   const currency = item.book?.productSupply?.prices?.[0]?.currency || "£";
  const currency = "£";

  return (
    <div className="bg-white rounded-xl shadow p-4 flex gap-4">
      {/* Image wrapper */}
      <div className="relative w-20 h-28 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
        {item?.book?.coverImage ? (
          <Image
            src={item.book.coverImage}
            alt={title}
            fill
            className="object-contain"
            sizes="80px"
          />
        ) : (
          <span className="text-gray-400 text-[8px] text-center px-1">{title}</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1">
        <h3 className="font-semibold text-lg leading-snug">{title}</h3>
        <p className="text-sm text-gray-500">
          Publisher: {item.book?.publishingDetail?.publisher?.name}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>

          <span className="font-semibold">
            {currency} {(price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutItemCard;
