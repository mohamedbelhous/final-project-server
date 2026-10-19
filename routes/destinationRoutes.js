
import express from "express";

import {
  getDestinations,
  getDestinationById,
} from "../controllers/destinationController.js";

const router = express.Router();

router.get("/", getDestinations);

router.get("/:id", getDestinationById);

export default router;
