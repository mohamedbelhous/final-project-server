import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    id: { type: String },
    slug: { type: String, trim: true },
    name: {
      type: String,
      required: [true, "Destination name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    image: { type: String },
    imageUrl: { type: String },
    heroImage: { type: String },
    imageQuery: { type: String },
    galleryQueries: [{ type: String }],
    description: { type: String },
    aboutText: { type: String },
    rating: { type: mongoose.Schema.Types.Mixed, default: 0 },
    ratingText: { type: String },
    reviewsCount: { type: mongoose.Schema.Types.Mixed, default: 0 },
    pricePerDay: { type: Number },
    galleryImages: [{ type: String }],
    whyVisit: [{ type: Object }],
    quickFacts: { type: Object },
    activities: [{ type: Object }],
    attractions: [{ type: Object }],
    accommodations: [{ type: Object }],
    highlights: [{ type: String }],
    bestTimeToVisit: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  {
    timestamps: true,
    strict: false,
  },
);

export default mongoose.model("Destination", destinationSchema);
