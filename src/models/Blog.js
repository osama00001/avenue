import mongoose from "mongoose";

/**
 * =====================================
 * BLOG
 * =====================================
 */
const BlogSchema = new mongoose.Schema(
  {
    /**
     * BASIC CONTENT
     */
    title: {
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

    excerpt: {
      type: String,
      default: "",
    },

    /**
     * ⭐ Supports CMS blocks / rich text JSON
     */
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /**
     * CATEGORY RELATION
     */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
      index: true,
    },

    /**
     * MEDIA
     */
    featuredImage: {
      type: String,
      default: "",
    },

    /**
     * AUTHOR
     */
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    /**
     * STATUS
     */
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    /**
     * ANALYTICS
     */
    views: {
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

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
