import mongoose from "mongoose";

/**
 * ============================================
 * CART ITEM
 * ============================================
 */
const cartItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 50,
    },

    // For ebooks
    ebookFormat: {
      type: String,
      enum: ["EPUB", "PDF", "KINDLE", null],
      default: null,
    },

    // Optional future optimization
    // avoids price recalculation at every render
    priceSnapshot: Number,
    currency: String,
  },
  { _id: false }
);

/**
 * ============================================
 * MAIN CART
 * ============================================
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,

    // reduces Mongo storage overhead
    versionKey: false,
  }
);

/**
 * ============================================
 * PREVENT DUPLICATE ITEMS
 * ============================================
 * Same book + same format merges quantity
 */
cartSchema.methods.addItem = function (payload) {
  const existing = this.items.find(
    (i) =>
      i.book.toString() === payload.book.toString() &&
      i.ebookFormat === payload.ebookFormat
  );

  if (existing) {
    existing.quantity += payload.quantity || 1;
  } else {
    this.items.push(payload);
  }
};

/**
 * ============================================
 * AUTO CLEAN ZERO QUANTITY
 * ============================================
 */
cartSchema.pre("save", function () {
  this.items = this.items.filter((i) => i.quantity > 0);
});

/**
 * ============================================
 * FAST LOOKUP INDEX
 * ============================================
 */
cartSchema.index({ user: 1 });
cartSchema.index({ "items.book": 1 });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
