import {
  createIncidentService,
  getReportsService,
  getPendingsService,
  getTasksService,
  acceptIncidentService,
  resolveIncidentService,
} from '../services/incidentService.js';

// 1. Tạo sự cố mới (Reporter)
export const createIncident = async (req, res) => {
  const { title, location, type, description } = req.body;

  const newIncident = await createIncidentService({
    title,
    location,
    type,
    description,
    reporterId: req.user.userId,
  });

  const io = req.app.get('io');
  if (io) {
    const reporterId = newIncident.reporter?._id || newIncident.reporter;
    io.to(`department_${newIncident.department}`)
      .to('room_admin')
      .to(`user_${reporterId}`)
      .emit('incident:created', {
        message: 'New incident reported successfully.',
        data: newIncident,
      });
  }

  return res.status(201).json({
    success: true,
    message: 'Incident created successfully.',
    data: newIncident,
  });
};

// 2. Lấy danh sách sự cố của chính mình (Reporter Tab 2)
export const getReports = async (req, res) => {
  const incidents = await getReportsService(req.user.userId);

  return res.status(200).json({
    success: true,
    message: 'Get my reported incidents successfully.',
    total: incidents.length,
    data: incidents,
  });
};

// 3. Lấy danh sách sự cố chờ tiếp nhận theo đúng phòng ban (Dispatcher Tab 1)
export const getPendings = async (req, res) => {
  const incidents = await getPendingsService(req.user.department);

  return res.status(200).json({
    success: true,
    message: 'Get pending incidents successfully.',
    total: incidents.length,
    data: incidents,
  });
};

// 4. Lấy danh sách sự cố do mình phụ trách (Dispatcher Tab 2)
export const getTasks = async (req, res) => {
  const tasks = await getTasksService(req.user.userId);

  return res.status(200).json({
    success: true,
    message: 'Get my assigned tasks successfully.',
    total: tasks.length,
    data: tasks,
  });
};

// 5. Bấm nhận sự cố (Dispatcher)
export const acceptIncident = async (req, res) => {
  const { incident, updatedIncident } = await acceptIncidentService(
    req.params.id,
    req.user
  );

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${incident.reporter}`)
      .to(`department_${incident.department}`)
      .to('room_admin')
      .emit('incident:accepted', {
        message: 'Incident accepted successfully.',
        data: updatedIncident,
      });
  }

  return res.status(200).json({
    success: true,
    message: 'Incident accepted successfully.',
    data: updatedIncident,
  });
};

// 6. Bấm hoàn thành sự cố (Dispatcher)
export const resolveIncident = async (req, res) => {
  const { incident, updatedIncident } = await resolveIncidentService(
    req.params.id,
    req.user,
    req.body.resolutionNotes
  );

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${incident.reporter}`)
      .to('room_admin')
      .emit('incident:resolved', {
        message: 'Incident resolved successfully.',
        data: updatedIncident,
      });
  }

  return res.status(200).json({
    success: true,
    message: 'Incident resolved successfully.',
    data: updatedIncident,
  });
};
