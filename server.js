import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import destinationRoutes from "./routes/destinationRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import guideRoutes from "./routes/guideRoutes.js";

import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use("/api/images", imageRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/destinations", destinationRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/guides", guideRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
