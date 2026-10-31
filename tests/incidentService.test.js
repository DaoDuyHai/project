import { describe, it, expect, vi, beforeEach } from 'vitest';
import Incident from '../models/incidentModel.js';
import {
  acceptIncidentService,
  resolveIncidentService,
  createIncidentService,
  getPendingsService,
} from '../services/incidentService.js';

// Mock toàn bộ Mongoose Model để không cần kết nối MongoDB
vi.mock('../models/incidentModel.js');

describe('IncidentService - Unit Tests (Mocked Model / No Database Connection)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. NGHIỆP VỤ TIẾP NHẬN SỰ CỐ (acceptIncidentService)
  // ----------------------------------------------------
  describe('acceptIncidentService - Nghiệp vụ tiếp nhận sự cố', () => {
    it('1. Trả về 404 Not Found nếu không tìm thấy sự cố theo ID', async () => {
      Incident.findById.mockResolvedValue(null);

      await expect(
        acceptIncidentService('incident_fake_id', {
          userId: 'user_tech',
          department: 'TECHNICAL',
        })
      ).rejects.toMatchObject({
        message: 'Incident not found.',
        statusCode: 404,
      });

      expect(Incident.findById).toHaveBeenCalledWith('incident_fake_id');
    });

    it('2. Trả về 403 Forbidden nếu nhân viên nhận ca không đúng chuyên môn phòng ban', async () => {
      Incident.findById.mockResolvedValue({
        _id: 'incident_med',
        department: 'MEDICAL',
      });

      await expect(
        acceptIncidentService('incident_med', {
          userId: 'user_tech',
          department: 'TECHNICAL', // Kỹ thuật viên cố tình nhận ca Y tế
        })
      ).rejects.toMatchObject({
        message: 'Access denied. This incident belongs to another department.',
        statusCode: 403,
      });
    });

    it('3. Trả về 409 Conflict khi bị tranh chấp (Race Condition: người khác đã nhận trước vài mili-giây)', async () => {
      Incident.findById.mockResolvedValue({
        _id: 'incident_123',
        department: 'TECHNICAL',
        status: 'PENDING',
      });

      // findOneAndUpdate trả về null vì status đã bị người khác đổi thành IN_PROGRESS
      Incident.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        acceptIncidentService('incident_123', {
          userId: 'user_tech_2',
          department: 'TECHNICAL',
        })
      ).rejects.toMatchObject({
        message:
          'This incident has already been accepted by another responder.',
        statusCode: 409,
      });
    });

    it('4. Tiếp nhận thành công khi đúng khoa và ca còn PENDING (Happy path)', async () => {
      const mockIncident = {
        _id: 'incident_123',
        department: 'TECHNICAL',
        reporter: 'user_student',
      };
      const mockUpdated = {
        _id: 'incident_123',
        department: 'TECHNICAL',
        status: 'IN_PROGRESS',
        responder: 'user_tech_1',
      };

      Incident.findById.mockResolvedValue(mockIncident);
      Incident.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockUpdated),
        }),
      });

      const result = await acceptIncidentService('incident_123', {
        userId: 'user_tech_1',
        department: 'TECHNICAL',
      });

      expect(result.incident).toEqual(mockIncident);
      expect(result.updatedIncident).toEqual(mockUpdated);
      expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'incident_123', status: 'PENDING' },
        { status: 'IN_PROGRESS', responder: 'user_tech_1' },
        { returnDocument: 'after' }
      );
    });
  });

  // ----------------------------------------------------
  // 2. NGHIỆP VỤ HOÀN THÀNH SỰ CỐ (resolveIncidentService)
  // ----------------------------------------------------
  describe('resolveIncidentService - Nghiệp vụ giải quyết sự cố', () => {
    it('5. Trả về 400 Bad Request nếu sự cố chưa ở trạng thái IN_PROGRESS', async () => {
      Incident.findById.mockResolvedValue({
        _id: 'incident_123',
        department: 'TECHNICAL',
        status: 'PENDING', // Ca chưa tiếp nhận mà đã bấm hoàn thành
        responder: 'user_tech_1',
      });

      await expect(
        resolveIncidentService(
          'incident_123',
          { userId: 'user_tech_1', department: 'TECHNICAL' },
          'Đã sửa xong'
        )
      ).rejects.toMatchObject({
        message: 'Incident must be in-progress before it can be resolved.',
        statusCode: 400,
      });
    });

    it('6. Trả về 403 Forbidden nếu người bấm hoàn thành không phải người đã nhận việc (Sai Ownership)', async () => {
      Incident.findById.mockResolvedValue({
        _id: 'incident_123',
        department: 'TECHNICAL',
        status: 'IN_PROGRESS',
        responder: 'user_tech_ORIGINAL',
      });

      await expect(
        resolveIncidentService(
          'incident_123',
          { userId: 'user_tech_IMPOSTER', department: 'TECHNICAL' },
          'Ghi chú'
        )
      ).rejects.toMatchObject({
        message:
          'Access denied. You are not the assigned responder for this incident.',
        statusCode: 403,
      });
    });

    it('7. Hoàn thành sự cố thành công khi đúng người nhận và đang IN_PROGRESS (Happy path)', async () => {
      const mockIncident = {
        _id: 'incident_123',
        department: 'TECHNICAL',
        status: 'IN_PROGRESS',
        responder: 'user_tech_1',
        reporter: 'user_student',
      };
      const mockUpdated = {
        ...mockIncident,
        status: 'RESOLVED',
        resolutionNotes: 'Đã thay ổ cắm điện an toàn',
        resolvedAt: new Date(),
      };

      Incident.findById.mockResolvedValue(mockIncident);
      Incident.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockUpdated),
        }),
      });

      const result = await resolveIncidentService(
        'incident_123',
        { userId: 'user_tech_1', department: 'TECHNICAL' },
        'Đã thay ổ cắm điện an toàn'
      );

      expect(result.updatedIncident.status).toBe('RESOLVED');
      expect(result.updatedIncident.resolutionNotes).toBe(
        'Đã thay ổ cắm điện an toàn'
      );
    });
  });

  // ----------------------------------------------------
  // 3. TẠO SỰ CỐ & ĐỊNH TUYẾN KHOA (createIncidentService)
  // ----------------------------------------------------
  describe('createIncidentService - Nghiệp vụ tạo sự cố & Tự động phân khoa', () => {
    it('8. Trả về 400 nếu thiếu các trường bắt buộc (title, location, type)', async () => {
      await expect(
        createIncidentService({
          title: '',
          location: 'Phòng 101',
          type: 'Hỏng điện',
          reporterId: 'user_1',
        })
      ).rejects.toMatchObject({
        message: 'Please provide title, location, and incident type.',
        statusCode: 400,
      });
    });

    it('9. Tự động định tuyến phòng ban MEDICAL cho sự cố sức khỏe / cấp cứu', async () => {
      const mockCreated = {
        _id: 'inc_med_1',
        title: 'Học sinh say nắng ngất xỉu',
        location: 'Sân thể dục',
        type: 'Tai nạn/Sức khỏe/Cấp cứu',
        department: 'MEDICAL',
        populate: vi.fn().mockResolvedValue(true),
      };

      Incident.create.mockResolvedValue(mockCreated);

      const result = await createIncidentService({
        title: 'Học sinh say nắng ngất xỉu',
        location: 'Sân thể dục',
        type: 'Tai nạn/Sức khỏe/Cấp cứu',
        reporterId: 'user_student',
      });

      expect(Incident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          department: 'MEDICAL',
        })
      );
      expect(result.department).toBe('MEDICAL');
    });

    it('10. Lấy danh sách sự cố chờ PENDING theo đúng phòng ban', async () => {
      const mockList = [
        { _id: '1', title: 'Hỏng đèn', department: 'TECHNICAL' },
        { _id: '2', title: 'Hỏng bồn nước', department: 'TECHNICAL' },
      ];

      Incident.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockList),
        }),
      });

      const result = await getPendingsService('TECHNICAL');

      expect(result).toEqual(mockList);
      expect(Incident.find).toHaveBeenCalledWith({
        status: 'PENDING',
        department: 'TECHNICAL',
      });
    });
  });
});
