import jwt from "jsonwebtoken";
import { createHttpError } from "../utils/createHttpError.js";

export const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw createHttpError("Access denied. No token provided.", 401);
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    throw createHttpError("Invalid token format. Bearer token required.", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    throw createHttpError("Invalid or expired token.", 401);
  }
};

export const authenticate = authMiddleware;
