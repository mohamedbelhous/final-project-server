import mongoose from "mongoose";

const guideSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
    items: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const guideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, "Article excerpt is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: [true, "Article category is required"],
      trim: true,
    },
    content: {
      type: [guideSectionSchema],
      default: [],
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const Guide = mongoose.model("Guide", guideSchema);

export default Guide;
