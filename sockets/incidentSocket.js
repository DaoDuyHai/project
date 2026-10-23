import jwt from "jsonwebtoken";

export const initIncidentSocket = (io) => {
  // 1. Middleware xác thực Token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      // Gắn thông tin giải mã được vào chính socket này
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  // 2. Khi kết nối thành công -> Phân phòng (Rooms)
  io.on("connection", (socket) => {
    const { userId, role, department } = socket.user;

    // Phòng cá nhân
    socket.join(`user_${userId}`);

    // Phòng cho nhân viên điều phối theo khoa/phòng ban
    if (role === "dispatcher" && department) {
      socket.join(`department_${department}`);
    }

    // Phòng cho Admin
    if (role === "admin") {
      socket.join("room_admin");
    }

    socket.on("disconnect", () => {});
  });
};
