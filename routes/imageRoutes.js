
import express from "express";
import { searchImages } from "../controllers/imageController.js";

const router = express.Router();

router.get("/search", searchImages);

export default router;
