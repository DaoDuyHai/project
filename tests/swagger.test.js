import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Swagger / OpenAPI 3.0 Documentation Endpoint Tests', () => {
  it('1. GET /docs/ - Trả về giao diện Swagger UI tài liệu HTML (HTTP 200)', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/html/);
    expect(response.text).toContain('swagger-ui');
  });

  it('2. GET /docs.json - Trả về tài liệu chuẩn OpenAPI 3.0 format JSON', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('openapi', '3.0.3');
    expect(response.body.info).toHaveProperty(
      'title',
      'School Incident Dispatch API'
    );
    expect(response.body.paths).toHaveProperty('/api/users/login');
    expect(response.body.paths).toHaveProperty('/api/incidents');
    expect(response.body.paths).toHaveProperty('/api/incidents/{id}/accept');
    expect(response.body.paths).toHaveProperty('/api/incidents/analytics');
    expect(response.body.paths).toHaveProperty('/health');
  });

  it('3. GET / - Trả về link điều hướng tới trang tài liệu /docs', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.documentation).toBe('/docs');
    expect(response.body.openApiJson).toBe('/docs.json');
  });
});
