import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { createHttpError } from "../utils/createHttpError.js";

export const register = async (req, res) => {
  const { userName, password, role } = req.body;

  if (!userName || !password) {
    throw createHttpError(
      "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      400
    );
  }

  if (password.length < 6) {
    throw createHttpError("Mật khẩu phải có ít nhất 6 ký tự.", 400);
  }

  const existingUser = await User.findOne({ userName });
  if (existingUser) {
    throw createHttpError("Tên đăng nhập đã tồn tại trên hệ thống.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    userName,
    password: hashedPassword,
    role: role || "student",
  });

  return res.status(201).json({
    message: "Đăng ký tài khoản thành công.",
    user: {
      id: newUser._id,
      userName: newUser.userName,
      role: newUser.role,
    },
  });
};

export const login = async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    throw createHttpError(
      "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      400
    );
  }

  const existingUser = await User.findOne({ userName }).select("+password");

  if (!existingUser) {
    throw createHttpError("Tên đăng nhập hoặc mật khẩu không chính xác.", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    throw createHttpError("Tên đăng nhập hoặc mật khẩu không chính xác.", 401);
  }

  const token = jwt.sign(
    {
      userId: existingUser._id,
      userName: existingUser.userName,
      role: existingUser.role,
    },
    process.env.SECRET_KEY,
    { expiresIn: "15m" }
  );

  return res.status(200).json({
    message: "Đăng nhập thành công.",
    token,
    user: {
      id: existingUser._id,
      userName: existingUser.userName,
      role: existingUser.role,
    },
  });
};
