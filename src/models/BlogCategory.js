import mongoose from "mongoose";

/**
 * =====================================
 * BLOG CATEGORY
 * =====================================
 */
const BlogCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    /**
     * Optional hierarchy (future proof)
     */
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      default: null,
    },

    /**
     * UI Control
     */
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    /**
     * SEO
     */
    metaTitle: String,
    metaDescription: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BlogCategory ||
  mongoose.model("BlogCategory", BlogCategorySchema);
