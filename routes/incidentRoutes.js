import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createIncident } from "../controllers/incidentController.js";

const router = express.Router();

// RESTful route: POST /api/incidents
router.post("/", authMiddleware, createIncident);



export default router;
