import express from "express";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";
import { getIncidents } from "../controllers/adminController.js";

const router = express.Router();

// Tự động bảo vệ TẤT CẢ các route admin: Bắt buộc đăng nhập VÀ có quyền Admin
router.use(authMiddleware, authorizeRoles("admin"));

// Lấy toàn bộ sự cố toàn trường (có hỗ trợ lọc theo ?status=...&department=...)
router.get("/incidents", getIncidents);

export default router;
