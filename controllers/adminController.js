import Incident from "../models/incidentModel.js";

export const getIncidents = async (req, res) => {
  const { status, department, page, limit } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (department) filter.department = department;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const total = await Incident.countDocuments(filter);

  const incidents = await Incident.find(filter)
    .skip(skip)
    .limit(limitNumber)
    .populate("reporter", "fullName userName")
    .populate("responder", "fullName userName")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Get all incidents successfully.",
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
    data: incidents,
  });
};

export const getAnalytics = async (req, res) => {
  const [statusStats, departmentStats, topLocations] = await Promise.all([
    Incident.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Incident.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]),
    Incident.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $project: { _id: 0, location: "$_id", count: 1 } },
    ]),
  ]);

  const summary = { total: 0, pending: 0, inProgress: 0, resolved: 0 };

  statusStats.forEach((item) => {
    if (item._id === "PENDING") summary.pending = item.count;
    if (item._id === "IN_PROGRESS") summary.inProgress = item.count;
    if (item._id === "RESOLVED") summary.resolved = item.count;

    summary.total += item.count;
  });

  const byDepartment = { TECHNICAL: 0, MEDICAL: 0 };

  departmentStats.forEach((item) => {
    if (item._id) byDepartment[item._id] = item.count;
  });

  return res.status(200).json({
    success: true,
    message: "Get incident analytics successfully.",
    data: {
      summary,
      byDepartment,
      topLocations,
    },
  });
};
