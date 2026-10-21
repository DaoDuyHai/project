import jwt from "jsonwebtoken";
import { createHttpError } from "../utils/createHttpError.js";

export const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw createHttpError("Không tìm thấy token.", 401);
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    throw createHttpError("Token không đúng định dạng.", 401);
  }

  const decoded = jwt.verify(token, process.env.SECRET_KEY);

  req.userId = decoded.userId;
  req.userName = decoded.userName;

  next();
};
