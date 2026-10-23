import Incident from "../models/incidentModel.js";
import { createHttpError } from "../utils/createHttpError.js";

// 1. Tạo sự cố mới (Reporter)
export const createIncident = async (req, res) => {
  const { title, location, type, description } = req.body;

  if (!title || !location || !type) {
    throw createHttpError(
      "Please provide title, location, and incident type.",
      400,
    );
  }

  let department = "TECHNICAL";
  if (type === "Tai nạn/Sức khỏe/Cấp cứu") {
    department = "MEDICAL";
  }

  const reporter = req.user.userId;

  const newIncident = await Incident.create({
    title,
    location,
    type,
    description,
    department,
    reporter,
  });

  await newIncident.populate("reporter", "fullName userName department");

  const io = req.app.get("io");

  io.to(`department_${department}`)
    .to("room_admin")
    .to(`user_${reporter}`)
    .emit("incident:created", {
      message: "Co su co moi vua dc bao cao",
      data: newIncident,
    });

  return res.status(201).json({
    success: true,
    message: "Incident created successfully.",
    incident: newIncident,
  });
};

// 2. Lấy danh sách sự cố của chính mình (Reporter Tab 2)
export const getReports = async (req, res) => {
  const incidents = await Incident.find({ reporter: req.user.userId })
    .populate("reporter", "fullName userName department")
    .sort({
      createdAt: -1,
    });

  return res.status(200).json({
    success: true,
    message: "Get my reported incidents successfully.",
    total: incidents.length,
    data: incidents,
  });
};

// 3. Lấy danh sách sự cố chờ tiếp nhận theo đúng phòng ban (Dispatcher Tab 1)
export const getPendings = async (req, res) => {
  const incidents = await Incident.find({
    status: "PENDING",
    department: req.user.department,
  })
    .populate("reporter", "fullName userName")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Get pending incidents successfully.",
    total: incidents.length,
    data: incidents,
  });
};

// 4. Lấy danh sách sự cố do mình phụ trách (Dispatcher Tab 2)
export const getTasks = async (req, res) => {
  const tasks = await Incident.find({ responder: req.user.userId })
    .populate("reporter", "fullName userName")
    .sort({ updatedAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Get my assigned tasks successfully.",
    total: tasks.length,
    data: tasks,
  });
};

// 5. Bấm nhận sự cố (Dispatcher)
export const acceptIncident = async (req, res) => {
  const incidentId = req.params.id;

  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw createHttpError("Incident not found.", 404);
  }

  // Kiểm tra chuyên môn phòng ban
  if (incident.department !== req.user.department) {
    throw createHttpError(
      "Access denied. This incident belongs to another department.",
      403,
    );
  }

  // Cập nhật nguyên tử: chỉ nhận khi status còn PENDING (chống 2 người nhận cùng lúc)
  const updatedIncident = await Incident.findOneAndUpdate(
    {
      _id: incidentId,
      status: "PENDING",
    },
    {
      status: "IN_PROGRESS",
      responder: req.user.userId,
    },
    {
      new: true,
    },
  );

  if (!updatedIncident) {
    throw createHttpError(
      "This incident has already been accepted by another responder.",
      400,
    );
  }

  const io = req.app.get("io");

  io.to(`user_${incident.reporter}`)
    .to(`department_${incident.department}`)
    .to("room_admin")
    .emit("incident:accepted", {
      message: "Sự cố đã được tiếp nhận",
      data: updatedIncident,
    });

  return res.status(200).json({
    success: true,
    message: "Incident accepted successfully.",
    incident: updatedIncident,
  });
};

// 6. Bấm hoàn thành sự cố (Dispatcher)
export const resolveIncident = async (req, res) => {
  const { resolutionNotes } = req.body;
  const incidentId = req.params.id;

  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw createHttpError("Incident not found.", 404);
  }

  // Kiểm tra chuyên môn phòng ban
  if (incident.department !== req.user.department) {
    throw createHttpError(
      "Access denied. This incident belongs to another department.",
      403,
    );
  }

  // Kiểm tra trạng thái hiện tại
  if (incident.status !== "IN_PROGRESS") {
    throw createHttpError(
      "Incident must be in-progress before it can be resolved.",
      400,
    );
  }

  // Kiểm tra quyền sở hữu: chỉ đúng người nhận việc mới được bấm hoàn thành
  if (
    !incident.responder ||
    incident.responder.toString() !== req.user.userId
  ) {
    throw createHttpError(
      "Access denied. You are not the assigned responder for this incident.",
      403,
    );
  }

  const updatedIncident = await Incident.findOneAndUpdate(
    {
      _id: incidentId,
      status: "IN_PROGRESS",
    },
    {
      status: "RESOLVED",
      resolutionNotes: resolutionNotes || "Resolved successfully.",
      resolvedAt: new Date(),
    },
    {
      new: true,
    },
  );

  if (!updatedIncident) {
    throw createHttpError(
      "Unable to resolve incident (status may have changed).",
      400,
    );
  }

  const io = req.app.get("io");

  io.to(`user_${incident.reporter}`)
    .to("room_admin")
    .emit("incident:resolved", {
      message: "Sự cố đã được xử lý hoàn thành",
      data: updatedIncident,
    });

  return res.status(200).json({
    success: true,
    message: "Incident resolved successfully.",
    incident: updatedIncident,
  });
};
