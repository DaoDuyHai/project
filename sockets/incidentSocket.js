import jwt from "jsonwebtoken";

export const initIncidentSocket = (io) => {
  // 1. Middleware xác thực Token (Hỗ trợ cả handshake.auth và header authorization)
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      // Gắn thông tin người dùng đã giải mã vào socket instance
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  // 2. Khi kết nối thành công -> Phân bổ Socket Rooms
  io.on("connection", (socket) => {
    const { userId, role, department } = socket.user;

    // Phòng riêng cá nhân (nhận phản hồi trực tiếp của chính mình)
    socket.join(`user_${userId}`);

    // Phòng nghiệp vụ theo khoa cho nhân viên điều phối (Dispatcher)
    if (role === "dispatcher" && department) {
      socket.join(`department_${department}`);
    }

    // Phòng giám sát toàn viện dành riêng cho Admin
    if (role === "admin") {
      socket.join("room_admin");
    }

    socket.on("disconnect", () => {});
  });
};
