import express from "express";
import { register, login } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Route lấy thông tin tài khoản hiện tại
router.get("/profile", authMiddleware, (req, res) => {
  return res.status(200).json({
    message: "Lấy thông tin tài khoản thành công.",
    user: req.user,
  });
});

export default router;
