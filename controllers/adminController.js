import Incident from "../models/incidentModel.js";

export const getIncidents = async (req, res) => {
  const { status, department } = req.query;

  // Xây dựng bộ lọc động (dynamic filter)
  const filter = {};
  if (status) filter.status = status;
  if (department) filter.department = department;

  const incidents = await Incident.find(filter)
    .populate("reporter", "fullName userName")
    .populate("responder", "fullName userName")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Get all incidents successfully.",
    total: incidents.length,
    data: incidents,
  });
};
