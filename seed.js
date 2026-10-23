import bcrypt from "bcrypt";
import mongoose from "mongoose";
import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/userModel.js";
import Incident from "./models/incidentModel.js";

async function seedData() {
  try {
    console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...");
    await connectDB();

    // 1. Dọn dẹp dữ liệu cũ (chỉ dọn dẹp các tài khoản mẫu)
    const seedUsernames = ["admin", "tech_tuan", "med_hoa", "student_nam"];
    const existingUsers = await User.find({ userName: { $in: seedUsernames } });
    const existingUserIds = existingUsers.map((u) => u._id);

    await Incident.deleteMany({ reporter: { $in: existingUserIds } });
    await User.deleteMany({ userName: { $in: seedUsernames } });

    // 2. Mã hóa mật khẩu chung
    const defaultPassword = await bcrypt.hash("password123", 10);
    const adminPassword = await bcrypt.hash("admin123", 10);

    // 3. Tạo các tài khoản mẫu đại diện cho từng vai trò
    const admin = await User.create({
      userName: "admin",
      password: adminPassword,
      fullName: "Quản Trị Viên Hệ Thống",
      role: "admin",
    });

    const techDispatcher = await User.create({
      userName: "tech_tuan",
      password: defaultPassword,
      fullName: "Kỹ Thuật Viên Tuấn",
      role: "dispatcher",
      department: "TECHNICAL",
    });

    const medDispatcher = await User.create({
      userName: "med_hoa",
      password: defaultPassword,
      fullName: "Bác Sĩ Lê Thị Hoa",
      role: "dispatcher",
      department: "MEDICAL",
    });

    const student = await User.create({
      userName: "student_nam",
      password: defaultPassword,
      fullName: "Nguyễn Văn Nam",
      role: "student",
    });

    // 4. Tạo 3 sự cố mẫu với các trạng thái khác nhau
    await Incident.create([
      {
        title: "Máy chiếu chập cháy bốc khói",
        location: "Phòng A302",
        type: "Hỏng điện/Nước/Thiết bị",
        department: "TECHNICAL",
        description: "Có mùi khét và tia lửa phát ra từ trần nhà",
        status: "PENDING",
        reporter: student._id,
      },
      {
        title: "Bồn nước tầng 2 rò rỉ ngập sàn",
        location: "Nhà vệ sinh tầng 2",
        type: "Hỏng điện/Nước/Thiết bị",
        department: "TECHNICAL",
        description: "Nước tràn ra hành lang lớp học",
        status: "IN_PROGRESS",
        reporter: student._id,
        responder: techDispatcher._id,
      },
      {
        title: "Học sinh choáng ngất tại sân thể dục",
        location: "Sân thể dục khu B",
        type: "Tai nạn/Sức khỏe/Cấp cứu",
        department: "MEDICAL",
        description: "Học sinh say nắng, đã đưa về phòng y tế sơ cứu",
        status: "RESOLVED",
        reporter: student._id,
        responder: medDispatcher._id,
        resolutionNotes: "Đã cho học sinh uống nước điện giải và nghỉ ngơi ổn định.",
        resolvedAt: new Date(),
      },
    ]);

    console.log("✅ Khởi tạo dữ liệu mẫu thành công!");
    console.log("-------------------------------------------------------");
    console.log("Tài khoản mẫu đã tạo (Mật khẩu mặc định trong ngoặc):");
    console.log("- Admin:      userName: 'admin'       (mật khẩu: 'admin123')");
    console.log("- Kỹ thuật:   userName: 'tech_tuan'   (mật khẩu: 'password123')");
    console.log("- Y tế:       userName: 'med_hoa'     (mật khẩu: 'password123')");
    console.log("- Sinh viên:  userName: 'student_nam' (mật khẩu: 'password123')");
    console.log("-------------------------------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo dữ liệu mẫu:", error);
    process.exit(1);
  }
}

seedData();

