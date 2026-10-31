import { randomUUID } from 'crypto';
import { logger } from '../config/logger.js';

/**
 * Middleware gán Request ID (Correlation ID) và cấu hình Structured Logging
 * - Mỗi request có một ID định danh duy nhất xuyên suốt vòng đời.
 * - Header X-Request-Id được gửi kèm trong phản hồi (Response Header).
 * - Gắn child logger (req.log) kèm requestId vào đối tượng req để mọi controller/service tái sử dụng.
 */
export const requestLogger = (req, res, next) => {
  // 1. Trích xuất hoặc sinh mới UUID v4 cho requestId
  const incomingId =
    req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0
      ? incomingId.trim()
      : randomUUID();

  req.id = requestId;
  req.requestId = requestId;

  // 2. Gắn X-Request-Id vào Response Header để Client/Frontend đối chiếu khi cần hỗ trợ
  res.setHeader('X-Request-Id', requestId);

  // 3. Khởi tạo Child Logger gắn sẵn requestId cho request hiện tại
  req.log = logger.child({ requestId });

  const startTime = Date.now();

  // Bỏ qua log thường kỳ cho endpoint /health ở production để tránh làm đầy log
  const isHealthCheck = req.path === '/health';

  if (!isHealthCheck) {
    req.log.info(
      {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
      '📥 Incoming request'
    );
  }

  // 4. Lắng nghe sự kiện finish khi response đã được gửi trả xong
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    if (isHealthCheck && statusCode < 400) {
      return;
    }

    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      duration: `${duration}ms`,
    };

    if (statusCode >= 500) {
      req.log.error(logData, '💥 Server error response');
    } else if (statusCode >= 400) {
      req.log.warn(logData, '⚠️ Client error response');
    } else {
      req.log.info(logData, '📤 Request completed successfully');
    }
  });

  next();
};

export default requestLogger;
