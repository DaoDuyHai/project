import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { httpServer, app } from '../server.js';
import { env } from '../config/env.js';

describe('Socket.io Room Isolation Test: Kiểm thử phân tách kênh truyền Real-time', () => {
  let server;
  let serverUrl;
  let techClient;
  let medicalClient;
  let adminClient;

  // Tạo token giả lập cho các vai trò khác nhau (không cần query DB)
  const techToken = jwt.sign(
    { userId: 'tech_01', role: 'dispatcher', department: 'TECHNICAL' },
    env.SECRET_KEY,
    { expiresIn: '1h' }
  );

  const medicalToken = jwt.sign(
    { userId: 'med_01', role: 'dispatcher', department: 'MEDICAL' },
    env.SECRET_KEY,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { userId: 'admin_01', role: 'admin' },
    env.SECRET_KEY,
    { expiresIn: '1h' }
  );

  beforeAll(async () => {
    // 1. Mở server HTTP trên một cổng ngẫu nhiên khả dụng (port 0)
    await new Promise((resolve) => {
      server = httpServer.listen(0, () => {
        const port = server.address().port;
        serverUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Ngắt kết nối tất cả client và đóng server
    if (techClient?.connected) techClient.disconnect();
    if (medicalClient?.connected) medicalClient.disconnect();
    if (adminClient?.connected) adminClient.disconnect();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. Từ chối kết nối nếu Client không truyền Authentication Token trong handshake', async () => {
    const unauthClient = ioClient(serverUrl, {
      transports: ['websocket'],
      auth: {}, // Không có token
      reconnection: false,
    });

    const error = await new Promise((resolve) => {
      unauthClient.on('connect_error', (err) => resolve(err));
    });

    expect(error.message).toBe('Authentication token required');
    unauthClient.disconnect();
  });

  it('2. Kết nối thành công khi có Token hợp lệ và tự động phân vào đúng Socket Rooms', async () => {
    // Khởi tạo 3 client thuộc các khoa/vai trò khác nhau
    techClient = ioClient(serverUrl, {
      transports: ['websocket'],
      auth: { token: techToken },
      reconnection: false,
    });

    medicalClient = ioClient(serverUrl, {
      transports: ['websocket'],
      auth: { token: medicalToken },
      reconnection: false,
    });

    adminClient = ioClient(serverUrl, {
      transports: ['websocket'],
      auth: { token: adminToken },
      reconnection: false,
    });

    // Chờ cả 3 client kết nối thành công
    await Promise.all([
      new Promise((resolve) => techClient.on('connect', resolve)),
      new Promise((resolve) => medicalClient.on('connect', resolve)),
      new Promise((resolve) => adminClient.on('connect', resolve)),
    ]);

    expect(techClient.connected).toBe(true);
    expect(medicalClient.connected).toBe(true);
    expect(adminClient.connected).toBe(true);
  });

  it('3. Kiểm thử cách ly Room: Sự cố Kỹ thuật phát đi thì ĐÚNG khoa Kỹ thuật và Admin nhận được, khoa Y tế KHÔNG nhận được', async () => {
    const io = app.get('io');

    let techReceivedData = null;
    let adminReceivedData = null;
    let medicalReceivedCount = 0;

    // Lắng nghe sự kiện ở từng client
    techClient.on('incident:created', (payload) => {
      techReceivedData = payload;
    });

    adminClient.on('incident:created', (payload) => {
      adminReceivedData = payload;
    });

    medicalClient.on('incident:created', () => {
      medicalReceivedCount++;
    });

    // Bắn sự kiện sự cố kỹ thuật vào 2 room: department_TECHNICAL và room_admin
    const mockPayload = {
      message: 'New incident reported successfully.',
      data: {
        _id: 'inc_tech_999',
        title: 'Máy in thư viện bị kẹt giấy chập điện',
        department: 'TECHNICAL',
      },
    };

    io.to('department_TECHNICAL')
      .to('room_admin')
      .emit('incident:created', mockPayload);

    // Chờ 250ms để kiểm chứng đường truyền mạng
    await new Promise((resolve) => setTimeout(resolve, 250));

    // KỲ VỌNG:
    // 1. Kỹ thuật viên (room: department_TECHNICAL) nhận được chính xác dữ liệu
    expect(techReceivedData).not.toBeNull();
    expect(techReceivedData.data.title).toBe(
      'Máy in thư viện bị kẹt giấy chập điện'
    );

    // 2. Admin (room: room_admin) nhận được chính xác dữ liệu
    expect(adminReceivedData).not.toBeNull();
    expect(adminReceivedData.data._id).toBe('inc_tech_999');

    // 3. Nhân viên Y tế (room: department_MEDICAL) TUYỆT ĐỐI KHÔNG nhận được
    expect(medicalReceivedCount).toBe(0);
  });
});
