import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookSchema = new Schema({
  // identifiers
  productIdentifiers: [{
    type: { type: String }, // '03', '15' etc
    value: { type: String } // ISBN
  }],

  // titles
  descriptiveDetail: {
    titles: [{
      type: { type: String },
      text: { type: String }
    }],
    contributors: [{
      role: String,
      nameInverted: String
    }],
    subjects: [{
      scheme: String,
      code: String,
      headingText: String
    }],
    productForm: String,
  },

  // pricing
  productSupply: {
    prices: [{
      amount: Number,
      currency: String,
      discountPercent: { type: Number, default: 0 }
    }]
  },

  coverImage: { type: String, index: true },
  recordReference: { type: String, index: true },
  isSellable: { type: Boolean, default: true, index: true },
  availabilityStatus: { type: String, index: true },

  categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],

  // Denormalised BIC subject-code prefixes for fast exact-match category
  // filtering (e.g. ["F","Y"]).  Populated by migration script.
  bicSubjectPrefixes: [{ type: String, index: true }],

}, { timestamps: true });

// 🔥 PRODUCTION INDEXES FOR 1.9M RECORDS
// 1. Homepage / slider queries: sellable first, then cover presence, then recency
bookSchema.index({ isSellable: -1, coverImage: -1, createdAt: -1 });

// 2. Category pages: exact-match on prefix → cover → date.
//    Multikey (bicSubjectPrefixes is an array) but it is the LAST
//    queried field, so Mongo can still top-k sort in memory for small limits.
bookSchema.index({ isSellable: 1, bicSubjectPrefixes: 1, coverImage: -1, createdAt: -1 });

// 3. Product-form filtering (paperback / hardback)
bookSchema.index({ "descriptiveDetail.productForm": 1, isSellable: -1, coverImage: -1 });

// 4. Admin product list — newest first (1.9M+ collection)
bookSchema.index({ createdAt: -1 });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
