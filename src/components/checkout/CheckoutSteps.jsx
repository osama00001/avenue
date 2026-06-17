"use client";

import { useRouter } from "next/navigation";

/**
 * Chevron-style progress bar: BASKET → DELIVERY → PAYMENT.
 *
 * Props:
 *   current  - "basket" | "delivery" | "payment"
 *   onStepClick - optional (stepId) => void. If omitted, basket navigates to /cart.
 */
const STEPS = [
  { id: "basket", label: "BASKET", href: "/cart" },
  { id: "delivery", label: "DELIVERY", href: "/checkout" },
  { id: "payment", label: "PAYMENT", href: "/checkout" },
];

const TEAL = "#FF6A00";

export default function CheckoutSteps({ current = "basket", onStepClick }) {
  const router = useRouter();
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  const handleClick = (step, index) => {
    // Only allow navigating to the current or earlier (already-completed) steps.
    if (index > currentIndex) return;
    if (onStepClick) {
      onStepClick(step.id);
    } else if (step.id === "basket") {
      router.push("/cart");
    }
  };

  return (
    <div className="flex w-full select-none overflow-hidden">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        const clickable = index <= currentIndex;

        // Chevron shape — last segment has a flat right edge.
        const isLast = index === STEPS.length - 1;
        const clip = isLast
          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)"
          : "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)";
        const firstClip = isLast
          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
          : "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)";

        return (
          <button
            key={step.id}
            type="button"
            disabled={!clickable}
            onClick={() => handleClick(step, index)}
            className={`relative flex-1 -ml-3 first:ml-0 py-3.5 text-center text-xs sm:text-sm font-semibold tracking-wide transition-colors
              ${isActive || isDone ? "text-white" : "text-gray-500"}
              ${clickable ? "cursor-pointer" : "cursor-default"}`}
            style={{
              backgroundColor: isActive || isDone ? TEAL : "#d9dcdd",
              clipPath: index === 0 ? firstClip : clip,
            }}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
