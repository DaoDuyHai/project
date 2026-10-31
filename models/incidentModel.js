import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Hỏng điện/Nước/Thiết bị', 'Tai nạn/Sức khỏe/Cấp cứu'],
      required: true,
    },
    department: {
      type: String,
      enum: ['TECHNICAL', 'MEDICAL'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED'],
      default: 'PENDING',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// 1. Compound Index: Tối ưu truy vấn Dispatcher xem sự cố theo khoa và Admin lọc trạng thái
incidentSchema.index({ status: 1, department: 1, createdAt: -1 });

// 2. Index: Tối ưu truy vấn Reporter xem lịch sử sự cố cá nhân
incidentSchema.index({ reporter: 1, createdAt: -1 });

// 3. Index: Tối ưu truy vấn lọc trạng thái tổng quát
incidentSchema.index({ status: 1, createdAt: -1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
