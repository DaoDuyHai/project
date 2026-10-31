import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initIncidentSocket } from './sockets/incidentSocket.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { logger } from './config/logger.js';

const app = express();

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// 1. Gắn Structured Logging & Request ID (Correlation ID) cho mọi request
app.use(requestLogger);

// 2. Cấu hình CORS cho Express REST API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Trạng thái phục vụ cho Graceful Shutdown
let isShuttingDown = false;

// Middleware từ chối nhận request mới nếu hệ thống đang thực hiện tắt (Graceful Shutdown)
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.set('Connection', 'close');
    return res.status(503).json({
      success: false,
      message: 'Server is currently shutting down. Please retry later.',
    });
  }
  next();
});

// 2. Health-check & Readiness Endpoint cho Docker / Kubernetes
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const healthData = {
    status: isDbConnected ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      readyState: mongoose.connection.readyState,
    },
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  };

  if (!isDbConnected) {
    return res.status(503).json(healthData);
  }

  return res.status(200).json(healthData);
});

// 3. Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School Incident Dispatch System API is running live 🚀',
    version: '1.0.0',
    docs: 'Import postman/SchoolIncidentDispatch.postman_collection.json to test all 11 endpoints.',
    health: '/health',
  });
});

const httpServer = http.createServer(app);

// 4. Khởi tạo Socket.io Server kèm CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.set('io', io);

initIncidentSocket(io);

// 5. Định tuyến REST API
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api', adminRoutes);

// 6. Bắt các route không tồn tại (404 Handler)
app.use((req, res) => {
  const requestId = req.id || req.requestId;
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    ...(requestId ? { requestId } : {}),
  });
});

// 7. Middleware xử lý lỗi tập trung
app.use(errorHandler);

// 8. Graceful Shutdown Handler (SIGTERM & SIGINT)
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(
    `\n🛑 [Shutdown] Received ${signal}. Starting graceful shutdown...`
  );

  // Đặt timeout an toàn: Buộc ngắt process nếu các kết nối còn nghẽn quá 10 giây
  const forceTimeout = setTimeout(() => {
    console.error(
      '⚠️ [Shutdown] Graceful shutdown timed out (10s). Forcing exit (1).'
    );
    process.exit(1);
  }, 10000);
  forceTimeout.unref();

  // 1. Dừng tiếp nhận request HTTP mới, cho phép các request đang xử lý dở hoàn tất
  httpServer.close((err) => {
    if (err) {
      console.error('❌ [Shutdown] Error closing HTTP server:', err);
      process.exit(1);
    }
    console.log(
      '✅ [Shutdown] HTTP server closed. In-flight requests completed.'
    );

    // 2. Đóng toàn bộ kết nối WebSocket (Socket.io)
    io.close(() => {
      console.log('✅ [Shutdown] Socket.io connections closed.');

      // 3. Đóng kết nối cơ sở dữ liệu MongoDB an toàn
      mongoose.connection
        .close(false)
        .then(() => {
          console.log('✅ [Shutdown] MongoDB connection closed safely.');
          console.log(
            '👋 [Shutdown] Process terminated gracefully with code 0.'
          );
          process.exit(0);
        })
        .catch((dbErr) => {
          console.error(
            '❌ [Shutdown] Error closing MongoDB connection:',
            dbErr
          );
          process.exit(1);
        });
    });
  });
};

if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

const PORT = env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
  });
}

export { app, httpServer, io, gracefulShutdown };
export default app;
