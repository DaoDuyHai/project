import jwt from "jsonwebtoken";
import { createHttpError } from "../utils/createHttpError.js";

export const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw createHttpError("Không tìm thấy token xác thực.", 401);
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    throw createHttpError("Token không đúng định dạng Bearer.", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    throw createHttpError("Token không hợp lệ hoặc đã hết hạn.", 401);
  }
};

// Alias ngắn gọn: authenticate
export const authenticate = authMiddleware;
