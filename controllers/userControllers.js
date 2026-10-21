import bcrypt from "bcrypt";
import User from "../schema/userSchema.js";
import jwt from "jsonwebtoken";
import { createHttpError } from "../utils/createHttpError.js";

export const registerController = async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    throw createHttpError("Username and password are required.", 400);
  }

  const existingUser = await User.findOne({ userName });

  if (existingUser) {
    throw createHttpError("Username already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    userName,
    password: hashedPassword,
  });

  return res.status(201).json({ message: "User registered successfully." });
};

export const loginController = async (req, res) => {
  const { userName, password } = req.body;

  const existingUser = await User.findOne({ userName });

  if (!existingUser) {
    throw createHttpError(
      "Tên đăng nhập hoặc mật khẩu không tồn tại trong hệ thống.",
      404,
    );
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    throw createHttpError("Tên đăng nhập hoặc mật khẩu không đúng.", 401);
  }

  const token = jwt.sign(
    {
      userId: existingUser._id,
      userName: existingUser.userName,
    },
    process.env.SECRET_KEY,
    { expiresIn: "15m" },
  );

  return res.status(200).json({ message: "Dang nhap thanh cong" }, token);
};
