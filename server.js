import express from "express";
import "dotenv/config";
import http from "http";
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

app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("io", io);

initIncidentSocket(io);

// Routes
app.use("/api/users", userRoutes);

app.use("/api/incidents", incidentRoutes);

app.use("/api", adminRoutes);

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
