import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { createHttpError } from "../utils/createHttpError.js";

export const register = async (req, res) => {
  const { userName, password, fullName, role, department } = req.body;

  // 1. Kiểm tra các trường bắt buộc
  if (!userName || !password || !fullName) {
    throw createHttpError(
      "Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và họ tên.",
      400,
    );
  }

  if (password.length < 6) {
    throw createHttpError("Mật khẩu phải có ít nhất 6 ký tự.", 400);
  }

  // 2. Nếu đăng ký làm nhân viên điều phối (dispatcher), bắt buộc phải có phòng ban
  if (role === "dispatcher") {
    if (!department || !["TECHNICAL", "MEDICAL"].includes(department)) {
      throw createHttpError(
        "Tài khoản Dispatcher bắt buộc phải thuộc phòng ban TECHNICAL hoặc MEDICAL.",
        400,
      );
    }
  }

  // 3. Kiểm tra trùng tên đăng nhập
  const existingUser = await User.findOne({ userName });
  if (existingUser) {
    throw createHttpError("Tên đăng nhập đã tồn tại trên hệ thống.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    userName,
    password: hashedPassword,
    fullName,
    role: role || "student",
    // Nếu không phải dispatcher thì department luôn là null
    department: role === "dispatcher" ? department : null,
  });

  return res.status(201).json({
    message: "Đăng ký tài khoản thành công.",
    user: {
      _id: newUser._id,
      userName: newUser.userName,
      fullName: newUser.fullName,
      role: newUser.role,
      department: newUser.department,
    },
  });
};

export const login = async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    throw createHttpError(
      "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      400,
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
      fullName: existingUser.fullName,
      role: existingUser.role,
      department: existingUser.department,
    },
    process.env.SECRET_KEY,
    { expiresIn: "1d" },
  );

  return res.status(200).json({
    message: "Đăng nhập thành công.",
    token,
    user: {
      _id: existingUser._id,
      userName: existingUser.userName,
      fullName: existingUser.fullName,
      role: existingUser.role,
      department: existingUser.department,
    },
  });
};
