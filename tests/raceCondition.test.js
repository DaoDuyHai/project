import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import User from '../models/userModel.js';
import Incident from '../models/incidentModel.js';
import connectDB from '../config/db.js';
import { env } from '../config/env.js';

describe('Race Condition Test: 10 kỹ thuật viên cùng bấm nhận 1 sự cố tại cùng một mili-giây', () => {
  const NUM_TECHNICIANS = 10;
  let studentUser;
  let techUsers = [];
  let techTokens = [];
  let testIncident;

  beforeAll(async () => {
    // 1. Kết nối MongoDB
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    while (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 2. Dọn dẹp dữ liệu cũ nếu còn
    await User.deleteMany({
      userName: { $regex: /^race_tech_|^race_student/ },
    });

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 3. Tạo 1 tài khoản sinh viên báo cáo sự cố
    studentUser = await User.create({
      userName: 'race_student',
      password: hashedPassword,
      fullName: 'Sinh Viên Báo Cáo Race Condition',
      role: 'student',
    });

    // 4. Tạo 10 kỹ thuật viên độc lập cùng thuộc khoa TECHNICAL
    const userDocs = [];
    for (let i = 1; i <= NUM_TECHNICIANS; i++) {
      userDocs.push({
        userName: `race_tech_${i}`,
        password: hashedPassword,
        fullName: `Kỹ Thuật Viên Số ${i}`,
        role: 'dispatcher',
        department: 'TECHNICAL',
      });
    }
    techUsers = await User.insertMany(userDocs);

    // 5. Cấp sẵn JWT Token cho cả 10 kỹ thuật viên
    techTokens = techUsers.map((tech) =>
      jwt.sign(
        {
          userId: tech._id.toString(),
          userName: tech.userName,
          fullName: tech.fullName,
          role: tech.role,
          department: tech.department,
        },
        env.SECRET_KEY,
        { expiresIn: '1d' }
      )
    );

    // 6. Tạo 1 sự cố mới ở trạng thái PENDING
    testIncident = await Incident.create({
      title: 'Chập điện quạt trần phòng học B101 bốc khói',
      location: 'Phòng học B101',
      type: 'Hỏng điện/Nước/Thiết bị',
      department: 'TECHNICAL',
      status: 'PENDING',
      reporter: studentUser._id,
    });
  }, 30000);

  afterAll(async () => {
    if (testIncident?._id) {
      await Incident.findByIdAndDelete(testIncident._id);
    }
    await User.deleteMany({
      userName: { $regex: /^race_tech_|^race_student/ },
    });
    await mongoose.disconnect();
  }, 30000);

  it('Đảm bảo khóa nguyên tử (Atomic Lock): Chính xác 1 request thành công (200 OK) và 9 request bị chặn (409 Conflict)', async () => {
    // Kích hoạt đồng thời 10 HTTP PATCH requests trong cùng 1 tích tắc bằng Promise.all
    const concurrentRequests = techTokens.map((token) =>
      request(app)
        .patch(`/api/incidents/${testIncident._id}/accept`)
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.all(concurrentRequests);

    // Phân loại kết quả HTTP status code
    const successResponses = responses.filter((res) => res.status === 200);
    const conflictResponses = responses.filter((res) => res.status === 409);

    // KỲ VỌNG CỐT LÕI (BULLET CV):
    // Đúng 1 người duy nhất thành công và 9 người còn lại bị chặn với mã 409
    expect(successResponses.length).toBe(1);
    expect(conflictResponses.length).toBe(9);

    // Kiểm tra nội dung response thành công
    const winnerData = successResponses[0].body.data;
    expect(winnerData.status).toBe('IN_PROGRESS');
    expect(winnerData.responder).toBeDefined();

    // Kiểm tra tất cả 9 request thất bại đều nhận được thông báo lỗi xung đột chuẩn
    conflictResponses.forEach((res) => {
      expect(res.body.message).toBe(
        'This incident has already been accepted by another responder.'
      );
    });

    // Xác minh trực tiếp trong cơ sở dữ liệu MongoDB thật:
    // Trạng thái sự cố đã chuyển sang IN_PROGRESS và người nhận đúng là kỹ thuật viên chiến thắng
    const finalDbIncident = await Incident.findById(testIncident._id);
    expect(finalDbIncident.status).toBe('IN_PROGRESS');
    expect(finalDbIncident.responder).not.toBeNull();

    const winnerUserId = winnerData.responder._id || winnerData.responder;
    expect(finalDbIncident.responder.toString()).toBe(winnerUserId.toString());
  });
});
