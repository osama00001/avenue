import mongoose from "mongoose";
import Counter from "./Counter.js";

/**
 * ============================================
 * ITEM SNAPSHOT
 * ============================================
 */
const OrderItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    title: String,
    type: String,
    price: Number,
    currency: String,

    quantity: {
      type: Number,
      default: 1,
    },

    ebookFormat: String,
  },
  { _id: false }
);

/**
 * ============================================
 * USER SNAPSHOT
 * ============================================
 */
const UserSnapshotSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    email: String,
  },
  { _id: false }
);

/**
 * ============================================
 * ADDRESS
 * ============================================
 */
const AddressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

/**
 * ============================================
 * ORDER SCHEMA
 * ============================================
 */
const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    user: UserSnapshotSchema,
    items: [OrderItemSchema],
    shippingAddress: AddressSchema,

    payment: {
      method: {
        type: String,
        enum: ["COD", "ONLINE", "PAYPAL", "STRIPE"],
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,            // PayPal order ID or Stripe paymentIntent ID
      paypalInfo: Object,
      stripeInfo: Object,               // { id, amount, currency, chargeId, receiptUrl, status }
      refundedAt: Date,
      refundedAmountPence: Number,
      disputeStatus: String,
      disputeReason: String,
      disputedAt: Date,
    },

    // LCP eBook fulfilment (Gardners webservice)
    lcpFulfilment: {
      status: {
        type: String,
        enum: ["pending", "awaiting_passphrase", "completed", "partial", "failed"],
        default: "pending",
      },
      passphrase: String,        // encrypted via lcp-encrypt before save
      passphraseHint: String,
      fulfillments: [Object],    // [{ isbn, ok, url, responseCode, message }]
      completedAt: Date,
    },

    status: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
      index: true,
    },

    subtotal: Number,
    shippingCost: Number,
    total: Number,

    // Gardners fulfilment tracking
    gardnersFulfilment: {
      orderRef:          String,   // 9-digit UNIQUEREF sent in EDI file
      gardnersRef:       String,   // Gardners' own reference from ACK
      ediSentAt:         Date,
      ackReceivedAt:     Date,
      ackStatus:         String,   // 'accepted' | 'partial' | 'backordered' | 'rejected'
      dispatchNo:        String,
      trackingNumber:    String,
      carrier:           String,
      dispatchDate:      Date,
      dispatchReceivedAt: Date,
    },
  },
  { timestamps: true }
);

/**
 * ============================================
 * SEQUENTIAL ORDER NUMBER
 * ============================================
 */
OrderSchema.pre("save", async function () {
  if (this.orderNumber) return;

  const counter = await Counter.findOneAndUpdate(
    { key: "orderNumber" },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  const seq = counter.seq;

  // Always pad to 4 digits minimum
  // but allow natural expansion beyond that
  const padded = String(seq).padStart(4, "0");

  this.orderNumber = `ORD-${padded}`;
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
