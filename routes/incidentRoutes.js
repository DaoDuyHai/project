import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createIncident,
  getReports,
  getPendings,
  getTasks,
  acceptIncident,
  resolveIncident,
} from "../controllers/incidentController.js";

const router = express.Router();

// RESTful route: POST /api/incidents
router.post("/", authMiddleware, createIncident);

router.get("/my-reports", authMiddleware, getReports);

// Sửa lỗi: Thêm dấu gạch chéo / trước pending
router.get("/pending", authMiddleware, getPendings);

router.get("/my-tasks", authMiddleware, getTasks);

router.patch("/:id/accept", authMiddleware, acceptIncident);

router.patch("/:id/resolve", authMiddleware, resolveIncident);

export default router;
