import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { createHttpError } from "../utils/createHttpError.js";

export const register = async (req, res) => {
  const { userName, password, fullName, role, department } = req.body;

  // 1. Validate required fields
  if (!userName || !password || !fullName) {
    throw createHttpError(
      "Please provide username, password, and full name.",
      400,
    );
  }

  if (password.length < 6) {
    throw createHttpError("Password must be at least 6 characters long.", 400);
  }

  // 2. Dispatcher role requires a valid department
  if (role === "dispatcher") {
    if (!department || !["TECHNICAL", "MEDICAL"].includes(department)) {
      throw createHttpError(
        "Dispatcher account must be assigned to either TECHNICAL or MEDICAL department.",
        400,
      );
    }
  }

  // 3. Check for existing username
  const existingUser = await User.findOne({ userName });
  if (existingUser) {
    throw createHttpError("Username already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    userName,
    password: hashedPassword,
    fullName,
    role: role || "student",
    department: role === "dispatcher" ? department : null,
  });

  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
    data: {
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
    throw createHttpError("Username and password are required.", 400);
  }

  const existingUser = await User.findOne({ userName }).select("+password");

  if (!existingUser) {
    throw createHttpError("Invalid username or password.", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    throw createHttpError("Invalid username or password.", 401);
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
    success: true,
    message: "Login successful.",
    token,
    data: {
      _id: existingUser._id,
      userName: existingUser.userName,
      fullName: existingUser.fullName,
      role: existingUser.role,
      department: existingUser.department,
    },
  });
};
