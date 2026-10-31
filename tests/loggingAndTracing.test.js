import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { logger } from '../config/logger.js';

describe('Structured Logging (Pino) & Request ID Tracing Tests', () => {
  it('1. Tự động sinh UUID v4 cho X-Request-Id trong Response Header nếu Client không truyền', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    const requestId = response.headers['x-request-id'];

    expect(requestId).toBeDefined();
    // Kiểm tra định dạng chuẩn UUID v4 (8-4-4-4-12 hex)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(requestId).toMatch(uuidRegex);
  });

  it('2. Giữ nguyên X-Request-Id từ Client gửi lên (Correlation ID xuyên suốt Microservices)', async () => {
    const customTraceId = 'custom-trace-id-abc-12345';

    const response = await request(app)
      .get('/')
      .set('X-Request-Id', customTraceId);

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe(customTraceId);
  });

  it('3. Khi xảy ra lỗi (404), phản hồi JSON tự động đính kèm requestId để hỗ trợ tra cứu log', async () => {
    const customTraceId = 'trace-client-err-789';

    const response = await request(app)
      .get('/api/route-khong-ton-tai')
      .set('X-Request-Id', customTraceId);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.headers['x-request-id']).toBe(customTraceId);
    expect(response.body.requestId).toBe(customTraceId);
  });

  it('4. Đối tượng logger Pino cấu hình chuẩn định dạng và mức độ (level)', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.child).toBe('function');
  });
});
