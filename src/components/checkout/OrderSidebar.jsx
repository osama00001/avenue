"use client";

/**
 * Persistent right-hand summary panel used across the basket/checkout steps.
 *
 * Props:
 *   step        - "basket" | "delivery" | "payment"
 *   itemCount   - number of items in the basket
 *   subtotal    - number
 *   deliveryCost- number
 *   deliveryLabel - string shown next to the delivery line (e.g. "Delivery")
 *   total       - number
 *   deliverTo   - address object (shown on the payment step)
 */

export default function OrderSidebar({
  step = "basket",
  itemCount = 0,
  subtotal = 0,
  deliveryCost = 0,
  deliveryLabel = "Delivery",
  total = 0,
  deliverTo = null,
}) {
  return (
    <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4 text-sm text-gray-800">
      {/* DELIVER TO (payment step) */}
      {step === "payment" && deliverTo && (
        <div className="border border-gray-200 bg-white p-4">
          <h3 className="text-base font-semibold mb-3">Deliver to</h3>
          <div className="space-y-0.5 text-gray-700">
            <div>{deliverTo.name}</div>
            {deliverTo.line1 && <div>{deliverTo.line1}</div>}
            {deliverTo.line2 && <div>{deliverTo.line2}</div>}
            {deliverTo.city && <div>{deliverTo.city}</div>}
            {deliverTo.state && <div>{deliverTo.state}</div>}
            {deliverTo.postalCode && <div>{deliverTo.postalCode}</div>}
            {deliverTo.country && <div>{deliverTo.country}</div>}
          </div>
        </div>
      )}

      {/* YOUR ORDER */}
      <div className="border border-gray-200 bg-white p-4">
        <h3 className="text-base font-semibold mb-3">Your order</h3>

        <div className="text-[#FF6A00] underline mb-3">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </div>

        <div className="space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{deliveryLabel}:</span>
            <span>{deliveryCost === 0 ? "FREE" : `£${deliveryCost.toFixed(2)}`}</span>
          </div>
        </div>

        <hr className="my-3 border-gray-200" />

        <div className="flex justify-between items-center font-semibold text-base">
          <span>Total to pay:</span>
          <span>£{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
