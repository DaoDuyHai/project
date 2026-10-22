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
