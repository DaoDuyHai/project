import express from "express";
import { register, login } from "../controllers/userController.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Get current user profile
router.get(
  "/profile",
  authMiddleware,
  authorizeRoles("teacher,student", "dispatcher", "admin"),
  (req, res) => {
    return res.status(200).json({
      message: "Get user profile successfully.",
      user: req.user,
    });
  },
);

export default router;
