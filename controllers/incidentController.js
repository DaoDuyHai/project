import Incident from "../models/incidentModel.js";
import { createHttpError } from "../utils/createHttpError.js";

export const createIncident = async (req, res) => {
  const { title, location, type, description } = req.body;

  // 1. Validate required fields
  if (!title || !location || !type) {
    throw createHttpError(
      "Please provide title, location, and incident type.",
      400,
    );
  }

  // 2. Automatically map incident type to department
  let department = "TECHNICAL";
  if (type === "Tai nạn/Sức khỏe/Cấp cứu") {
    department = "MEDICAL";
  }

  // 3. Extract reporter userId from authenticated JWT
  const reporter = req.user.userId;

  // 4. Create incident in database
  const newIncident = await Incident.create({
    title,
    location,
    type,
    description,
    department,
    reporter,
  });

  return res.status(201).json({
    message: "Incident created successfully.",
    incident: newIncident,
  });
};

export const getReports = async (req, res) => {
  const incidents = await Incident.find({ reporter: req.user.userId });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Lấy danh sách sự cố thành công.",
    data: incidents,
  });
};

export const getPendings = async (req, res) => {
  const incidents = await Incident.find({
    status: "PENDING",
    department: req.user.department,
  });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Lấy danh sách sự cố đang pending thành công.",
    data: incidents,
  });
};

export const getTasks = async (req, res) => {
  const tasks = await Incident.find({ responder: req.user.userId });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Lấy danh sách nhiệm vụ thành công.",
    data: tasks,
  });
};

export const acceptIncident = async (req, res) => {
  const idIncident = req.params.id;

  const incident = await Incident.findById(idIncident);
  if (!incident) {
    throw createHttpError(
      "Không tìm thấy sự cố với ID này trong database.",
      404,
    );
  }

  if (incident.department !== req.user.department) {
    throw createHttpError(
      "Sự cố này thuộc phòng ban khác, bạn không có quyền nhận.",
      403,
    );
  }

  const updatedIncident = await Incident.findOneAndUpdate(
    {
      _id: idIncident,
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
    throw createHttpError("Sự cố này da co nguoi nhan", 400);
  }

  return res.status(200).json({
    success: true,
    message: "Đã nhận nhiệm vụ thành công.",
    incident: updatedIncident,
  });
};

export const resolveIncident = async (req, res) => {
  const { resolutionNotes } = req.body;
  const idIncident = req.params.id;

  const incident = await Incident.findById(idIncident);

  if (!incident) {
    throw createHttpError("Sự cố này không tồn tại", 404);
  }

  if (incident.department !== req.user.department) {
    throw createHttpError("Bạn không có quyền hoàn thành sự cố này", 403);
  }

  if (incident.status !== "IN_PROGRESS") {
    throw createHttpError(
      "Sự cố này chưa được nhận việc hoặc đã hoàn thành từ trước",
      400,
    );
  }

  if (incident.responder.toString() !== req.user.userId) {
    throw createHttpError("Bạn không phải là người nhận nhiệm vụ này", 403); // Sửa thành 403
  }

  const updateIncident = await Incident.findOneAndUpdate(
    {
      _id: idIncident,
      status: "IN_PROGRESS",
    },
    {
      status: "RESOLVED",
      resolutionNotes: resolutionNotes || "",
      resolvedAt: Date.now(),
    },
    {
      new: true,
    },
  );

  if (!updateIncident) {
    throw createHttpError(
      "Không thể hoàn thành sự cố này (trạng thái đã thay đổi).",
      400,
    );
  }

  return res.status(200).json({
    success: true,
    message: "Đã hoàn thành nhiệm vụ.",
    incident: updateIncident,
  });
};
