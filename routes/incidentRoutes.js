import express from "express";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import {
  createIncident,
  getReports,
  getPendings,
  getTasks,
  acceptIncident,
  resolveIncident,
} from "../controllers/incidentController.js";

const router = express.Router();

// 1. Áp dụng xác thực đăng nhập cho TẤT CẢ các route sự cố (không cần lặp lại ở từng route)
router.use(authMiddleware);

// 2. Nhóm route dành cho Người báo cáo (Reporter: Học sinh & Giáo viên)
router.post("/", authorizeRoles("student", "teacher"), createIncident);
router.get("/my-reports", authorizeRoles("student", "teacher"), getReports);

// 3. Nhóm route dành riêng cho Nhân viên điều phối (Dispatcher)
router.get("/pending", authorizeRoles("dispatcher"), getPendings);
router.get("/my-tasks", authorizeRoles("dispatcher"), getTasks);
router.patch("/:id/accept", authorizeRoles("dispatcher"), acceptIncident);
router.patch("/:id/resolve", authorizeRoles("dispatcher"), resolveIncident);

export default router;
