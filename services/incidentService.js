import Incident from '../models/incidentModel.js';
import { createHttpError } from '../utils/createHttpError.js';

// 1. Nghiệp vụ tạo sự cố mới
export const createIncidentService = async ({
  title,
  location,
  type,
  description,
  reporterId,
}) => {
  if (!title || !location || !type) {
    throw createHttpError(
      'Please provide title, location, and incident type.',
      400
    );
  }

  let department = 'TECHNICAL';
  if (type === 'Tai nạn/Sức khỏe/Cấp cứu') {
    department = 'MEDICAL';
  }

  const newIncident = await Incident.create({
    title,
    location,
    type,
    description,
    department,
    reporter: reporterId,
  });

  await newIncident.populate('reporter', 'fullName userName department');
  return newIncident;
};

// 2. Nghiệp vụ lấy danh sách sự cố của chính mình (Reporter)
export const getReportsService = async (reporterId) => {
  return await Incident.find({ reporter: reporterId })
    .populate('reporter', 'fullName userName department')
    .sort({ createdAt: -1 });
};

// 3. Nghiệp vụ lấy sự cố chờ theo phòng ban (Dispatcher)
export const getPendingsService = async (department) => {
  return await Incident.find({
    status: 'PENDING',
    department,
  })
    .populate('reporter', 'fullName userName')
    .sort({ createdAt: -1 });
};

// 4. Nghiệp vụ lấy danh sách sự cố do mình phụ trách (Dispatcher)
export const getTasksService = async (responderId) => {
  return await Incident.find({ responder: responderId })
    .populate('reporter', 'fullName userName')
    .sort({ updatedAt: -1 });
};

// 5. Nghiệp vụ tiếp nhận sự cố (Dispatcher - Khóa nguyên tử chống Race Condition)
export const acceptIncidentService = async (incidentId, user) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw createHttpError('Incident not found.', 404);
  }

  // Kiểm tra chuyên môn phòng ban
  if (incident.department !== user.department) {
    throw createHttpError(
      'Access denied. This incident belongs to another department.',
      403
    );
  }

  // Cập nhật nguyên tử: chỉ nhận khi status còn PENDING
  const query = Incident.findOneAndUpdate(
    {
      _id: incidentId,
      status: 'PENDING',
    },
    {
      status: 'IN_PROGRESS',
      responder: user.userId,
    },
    {
      new: true,
    }
  );

  // Hỗ trợ cả trường hợp chain populate hoặc mock object
  const updatedIncident =
    typeof query?.populate === 'function'
      ? await query
          .populate('reporter', 'fullName userName department')
          .populate('responder', 'fullName userName department')
      : await query;

  if (!updatedIncident) {
    throw createHttpError(
      'This incident has already been accepted by another responder.',
      409
    );
  }

  return { incident, updatedIncident };
};

// 6. Nghiệp vụ hoàn thành sự cố (Dispatcher - Kiểm tra quyền sở hữu & trạng thái)
export const resolveIncidentService = async (
  incidentId,
  user,
  resolutionNotes
) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw createHttpError('Incident not found.', 404);
  }

  // Kiểm tra chuyên môn phòng ban
  if (incident.department !== user.department) {
    throw createHttpError(
      'Access denied. This incident belongs to another department.',
      403
    );
  }

  // Kiểm tra trạng thái hiện tại
  if (incident.status !== 'IN_PROGRESS') {
    throw createHttpError(
      'Incident must be in-progress before it can be resolved.',
      400
    );
  }

  // Kiểm tra quyền sở hữu: chỉ đúng người nhận việc mới được bấm hoàn thành
  if (!incident.responder || incident.responder.toString() !== user.userId) {
    throw createHttpError(
      'Access denied. You are not the assigned responder for this incident.',
      403
    );
  }

  const query = Incident.findOneAndUpdate(
    {
      _id: incidentId,
      status: 'IN_PROGRESS',
    },
    {
      status: 'RESOLVED',
      resolutionNotes: resolutionNotes || 'Resolved successfully.',
      resolvedAt: new Date(),
    },
    {
      new: true,
    }
  );

  const updatedIncident =
    typeof query?.populate === 'function'
      ? await query
          .populate('reporter', 'fullName userName department')
          .populate('responder', 'fullName userName department')
      : await query;

  if (!updatedIncident) {
    throw createHttpError(
      'Unable to resolve incident (status may have changed).',
      400
    );
  }

  return { incident, updatedIncident };
};
