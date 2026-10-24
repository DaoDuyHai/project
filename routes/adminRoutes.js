import express from "express";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import { getIncidents, getAnalytics } from "../controllers/adminController.js";

const router = express.Router();

const adminGuard = [authMiddleware, authorizeRoles("admin")];

// 1. Lấy toàn bộ sự cố toàn trường (Admin có quyền xem và lọc phân trang)
router.get("/incidents", adminGuard, getIncidents);

// 2. Thống kê số liệu KPI Analytics (MongoDB Aggregation Pipeline)
router.get("/incidents/analytics", adminGuard, getAnalytics);

export default router;
