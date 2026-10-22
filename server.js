import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";

import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/incidents", incidentRoutes);

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
