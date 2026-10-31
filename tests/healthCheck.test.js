import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';

describe('Health Check & System Diagnostics API Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. GET /health - Trả về HTTP 200 và trạng thái UP khi MongoDB đã kết nối', async () => {
    // Đảm bảo giả lập readyState = 1 (Connected)
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body.database).toEqual({
      status: 'CONNECTED',
      readyState: 1,
    });
    expect(response.body.memoryUsage).toHaveProperty('rss');
    expect(response.body.memoryUsage).toHaveProperty('heapUsed');
  });

  it('2. GET /health - Trả về HTTP 503 và trạng thái DOWN khi MongoDB mất kết nối (Readiness Probe)', async () => {
    // Giả lập trạng thái readyState = 0 (Disconnected)
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'DOWN');
    expect(response.body.database).toEqual({
      status: 'DISCONNECTED',
      readyState: 0,
    });
  });

  it('3. GET / - Trả về HTTP 200 và thông tin điều hướng của hệ thống', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('health', '/health');
  });
});
