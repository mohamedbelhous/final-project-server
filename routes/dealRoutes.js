import express from "express";
import { getAllDeals, getDealById } from "../controllers/dealController.js";

const router = express.Router();

router.get("/", getAllDeals);
router.get("/:id", getDealById);

export default router;
