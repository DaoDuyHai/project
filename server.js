import express from "express";
import http from "http";
import { env } from "./config/env.js";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { initIncidentSocket } from "./sockets/incidentSocket.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// 1. Cấu hình CORS cho Express REST API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// 2. Health-check / Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "School Incident Dispatch System API is running live 🚀",
    version: "1.0.0",
    docs: "Import postman/SchoolIncidentDispatch.postman_collection.json to test all 11 endpoints.",
  });
});

const httpServer = http.createServer(app);

// 3. Khởi tạo Socket.io Server kèm CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("io", io);

initIncidentSocket(io);

// 4. Định tuyến REST API
app.use("/api/users", userRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api", adminRoutes);

// 5. Bắt các route không tồn tại (404 Handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 6. Middleware xử lý lỗi tập trung
app.use(errorHandler);

const PORT = env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
