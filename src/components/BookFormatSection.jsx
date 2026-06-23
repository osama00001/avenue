import {
  DISPLAY_FORMATS,
  getBookDisplayFormatKey,
} from "@/lib/bookFormats";

function FormatPrice({ price, originalPrice, discountPercent }) {
  const displayPrice =
    typeof price === "number" ? price.toFixed(2) : String(price);
  const displayOriginal =
    typeof originalPrice === "number"
      ? originalPrice.toFixed(2)
      : String(originalPrice ?? "");

  return (
    <span className="block text-base font-bold text-gray-900 mt-1">
      {Number(discountPercent) > 0 && (
        <span className="line-through text-gray-400 font-normal text-sm mr-1">
          £{displayOriginal}
        </span>
      )}
      £{displayPrice}
    </span>
  );
}

function FormatCard({
  format,
  isActive,
  interactive,
  price,
  originalPrice,
  discountPercent,
}) {
  const baseClasses =
    "min-w-[5.5rem] flex-1 px-3 py-3 text-center border transition-colors";
  const activeClasses =
    "bg-[#eef6f9] border-gray-300 border-b-4 border-b-[#346484]";
  const inactiveClasses =
    "bg-white border-gray-300 opacity-60 cursor-not-allowed pointer-events-none";

  const className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

  const content = (
    <>
      <span className="block text-sm font-medium text-gray-600">
        {format.label}
      </span>
      <FormatPrice
        price={price}
        originalPrice={originalPrice}
        discountPercent={discountPercent}
      />
    </>
  );

  if (isActive && interactive) {
    return (
      <button type="button" className={className} aria-pressed="true">
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export default function BookFormatSection({
  book,
  price,
  originalPrice,
  discountPercent = 0,
  interactive = false,
}) {
  const activeKey = getBookDisplayFormatKey(book);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Formats</h3>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-2 min-w-max sm:min-w-0">
          {DISPLAY_FORMATS.map((format) => (
            <FormatCard
              key={format.key}
              format={format}
              isActive={format.key === activeKey}
              interactive={interactive}
              price={price}
              originalPrice={originalPrice}
              discountPercent={discountPercent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
