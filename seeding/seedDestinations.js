import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Destination from "../models/Destination.js";
import { destinationsData } from "./destinationsData.js";
import { destinationDetailsData } from "./destinationDetailsData-unsplash-ready.js";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seedDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected successfully.");

    await Destination.deleteMany({});
    console.log("🗑️ Existing destinations collection cleared.");

    // 1. فك المصفوفات المزدوجة [ [ ... ] ] إلى مصفوفة بسيطة [ ... ]
    const flatBasic = destinationsData.flat(Infinity);
    const flatDetails = destinationDetailsData.flat(Infinity);

    // 2. دمج البيانات الأساسية مع التفاصيل لكل عنصر
    const fullDestinations = flatBasic.map((basicItem) => {
      const details =
        flatDetails.find(
          (detail) =>
            detail.id === basicItem.id ||
            (detail.slug && basicItem.slug && detail.slug === basicItem.slug) ||
            (detail.name &&
              basicItem.name &&
              detail.name.toLowerCase() === basicItem.name.toLowerCase()),
        ) || {};

      return {
        ...basicItem,
        ...details,
        name: basicItem.name || details.name || "Unknown Destination",
        location: details.location || basicItem.region || "Unknown Location",
      };
    });

    await Destination.insertMany(fullDestinations);
    console.log(
      `🚀 Initial destination data seeded successfully with ${fullDestinations.length} items!`,
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error while seeding data:", error.message || error);
    process.exit(1);
  }
};

seedDB();
