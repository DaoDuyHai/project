import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import app from '../server.js';
import User from '../models/userModel.js';
import Incident from '../models/incidentModel.js';
import connectDB from '../config/db.js';

describe('Integration Test: Quy trình Xử lý Sự cố (Supertest + DB)', () => {
  let studentUser;
  let techUser;
  let studentToken;
  let techToken;
  let createdIncidentId;

  // 1. Chuẩn bị dữ liệu tài khoản mẫu trong Database trước khi chạy test
  beforeAll(async () => {
    // Đảm bảo kết nối MongoDB đã sẵn sàng
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    while (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Dọn dẹp tài khoản test cũ nếu còn sót lại
    await User.deleteMany({
      userName: { $in: ['itest_student', 'itest_tech'] },
    });

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Tạo tài khoản sinh viên (Reporter)
    studentUser = await User.create({
      userName: 'itest_student',
      password: hashedPassword,
      fullName: 'Sinh Viên Integration Test',
      role: 'student',
    });

    // Tạo tài khoản kỹ thuật viên (Dispatcher)
    techUser = await User.create({
      userName: 'itest_tech',
      password: hashedPassword,
      fullName: 'Kỹ Thuật Viên Integration Test',
      role: 'dispatcher',
      department: 'TECHNICAL',
    });
  }, 20000);

  // 2. Dọn dẹp dữ liệu sau khi hoàn thành tất cả các bài test
  afterAll(async () => {
    if (createdIncidentId) {
      await Incident.findByIdAndDelete(createdIncidentId);
    }
    if (studentUser?._id && techUser?._id) {
      await User.deleteMany({
        _id: { $in: [studentUser._id, techUser._id] },
      });
    }
    await mongoose.disconnect();
  }, 20000);

  // ----------------------------------------------------------------
  // BƯỚC 1: ĐĂNG NHẬP LẤY JWT TOKEN (Authentication)
  // ----------------------------------------------------------------
  describe('Bước 1: Đăng nhập lấy Token xác thực (POST /api/users/login)', () => {
    it('1.1 Sinh viên đăng nhập thành công và nhận JWT Token', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          userName: 'itest_student',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful.');
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');

      studentToken = response.body.token;
    });

    it('1.2 Kỹ thuật viên đăng nhập thành công và nhận JWT Token', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          userName: 'itest_tech',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();

      techToken = response.body.token;
    });
  });

  // ----------------------------------------------------------------
  // BƯỚC 2: SINH VIÊN TẠO SỰ CỐ MỚI (Incident Reporting)
  // ----------------------------------------------------------------
  describe('Bước 2: Sinh viên báo cáo sự cố mới (POST /api/incidents)', () => {
    it('2.1 Tạo sự cố thành công, tự động gán trạng thái PENDING và phòng ban TECHNICAL', async () => {
      const incidentPayload = {
        title: 'Máy chiếu phòng A302 chập cháy bốc khói',
        location: 'Phòng học A302',
        type: 'Hỏng điện/Nước/Thiết bị',
        description: 'Có mùi khét và tia lửa điện phát ra từ máy chiếu',
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(incidentPayload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident created successfully.');

      const incident = response.body.data;
      expect(incident._id).toBeDefined();
      expect(incident.title).toBe(incidentPayload.title);
      expect(incident.location).toBe(incidentPayload.location);
      expect(incident.department).toBe('TECHNICAL');
      expect(incident.status).toBe('PENDING');

      createdIncidentId = incident._id;

      // Xác minh trực tiếp bản ghi đã tồn tại trong MongoDB
      const dbIncident = await Incident.findById(createdIncidentId);
      expect(dbIncident).not.toBeNull();
      expect(dbIncident.status).toBe('PENDING');
    });
  });

  // ----------------------------------------------------------------
  // BƯỚC 3: KỸ THUẬT VIÊN XEM & TIẾP NHẬN SỰ CỐ (Accept Incident)
  // ----------------------------------------------------------------
  describe('Bước 3: Kỹ thuật viên tiếp nhận sự cố (PATCH /api/incidents/:id/accept)', () => {
    it('3.1 Kỹ thuật viên xem danh sách chờ và thấy sự cố vừa tạo', async () => {
      const response = await request(app)
        .get('/api/incidents/pending')
        .set('Authorization', `Bearer ${techToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const pendingList = response.body.data;
      const found = pendingList.some((item) => item._id === createdIncidentId);
      expect(found).toBe(true);
    });

    it('3.2 Tiếp nhận sự cố thành công, cập nhật trạng thái sang IN_PROGRESS và gán responder', async () => {
      const response = await request(app)
        .patch(`/api/incidents/${createdIncidentId}/accept`)
        .set('Authorization', `Bearer ${techToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident accepted successfully.');

      const updated = response.body.data;
      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.responder).toBeDefined();

      // Kiểm chứng trực tiếp trong Database thật
      const dbIncident = await Incident.findById(createdIncidentId);
      expect(dbIncident.status).toBe('IN_PROGRESS');
      expect(dbIncident.responder.toString()).toBe(techUser._id.toString());
    });

    it('3.3 Chống tranh chấp (Race Condition): Cố tình nhận lại ca đã IN_PROGRESS phải trả về 409 Conflict', async () => {
      const response = await request(app)
        .patch(`/api/incidents/${createdIncidentId}/accept`)
        .set('Authorization', `Bearer ${techToken}`)
        .expect(409);

      expect(response.body.message).toBe(
        'This incident has already been accepted by another responder.'
      );
    });
  });

  // ----------------------------------------------------------------
  // BƯỚC 4: KỸ THUẬT VIÊN HOÀN THÀNH SỰ CỐ (Resolve Incident)
  // ----------------------------------------------------------------
  describe('Bước 4: Kỹ thuật viên hoàn thành sự cố (PATCH /api/incidents/:id/resolve)', () => {
    it('4.1 Hoàn thành sự cố thành công, cập nhật trạng thái RESOLVED và ghi chú nghiệm thu', async () => {
      const resolutionPayload = {
        resolutionNotes: 'Đã thay bóng đèn và dây nguồn máy chiếu mới an toàn.',
      };

      const response = await request(app)
        .patch(`/api/incidents/${createdIncidentId}/resolve`)
        .set('Authorization', `Bearer ${techToken}`)
        .send(resolutionPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Incident resolved successfully.');

      const resolvedData = response.body.data;
      expect(resolvedData.status).toBe('RESOLVED');
      expect(resolvedData.resolutionNotes).toBe(
        resolutionPayload.resolutionNotes
      );
      expect(resolvedData.resolvedAt).toBeDefined();

      // Kiểm chứng trạng thái cuối cùng trong Database thật
      const dbIncident = await Incident.findById(createdIncidentId);
      expect(dbIncident.status).toBe('RESOLVED');
      expect(dbIncident.resolutionNotes).toBe(
        resolutionPayload.resolutionNotes
      );
    });
  });
});
