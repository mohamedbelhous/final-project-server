
import express from "express";

import {
  getPublishedGuides,
  getPublishedGuideById,
  getAllGuidesForAdmin,
  createGuide,
  updateGuide,
  deleteGuide,
} from "../controllers/guideController.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin/all", protect, adminOnly, getAllGuidesForAdmin);

router.post("/", protect, adminOnly, createGuide);
router.put("/:id", protect, adminOnly, updateGuide);
router.delete("/:id", protect, adminOnly, deleteGuide);

router.get("/", getPublishedGuides);
router.get("/:id", getPublishedGuideById);

export default router;