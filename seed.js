import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/userModel.js';
import Incident from './models/incidentModel.js';

async function seedData() {
  try {
    console.log(
      '🌱 Bắt đầu kết nối cơ sở dữ liệu và nạp dữ liệu mẫu (Seeding)...'
    );
    await connectDB();

    // 1. Xóa sạch dữ liệu cũ trong collections
    console.log(
      '🧹 Đang dọn sạch toàn bộ collections cũ (Users, Incidents)...'
    );
    await Incident.deleteMany({});
    await User.deleteMany({});
    console.log('✔ Đã làm sạch database.');

    // 2. Mã hóa mật khẩu an toàn bằng bcrypt (mật khẩu mặc định: "123")
    const defaultPassword = '123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Tạo dữ liệu mẫu đầy đủ các vai trò
    console.log('👥 Đang khởi tạo tài khoản mẫu...');

    // 3.1 Admin
    await User.create({
      userName: 'admin01',
      password: hashedPassword,
      fullName: 'Quản trị viên hệ thống',
      role: 'admin',
    });

    // 3.2 Dispatchers (Kỹ thuật & Y tế)
    const tech01 = await User.create({
      userName: 'tech01',
      password: hashedPassword,
      fullName: 'Kỹ thuật viên Điện Nước',
      role: 'dispatcher',
      department: 'TECHNICAL',
    });

    const tech02 = await User.create({
      userName: 'tech02',
      password: hashedPassword,
      fullName: 'Nhân viên Y tế Học đường',
      role: 'dispatcher',
      department: 'MEDICAL',
    });

    // 3.3 Students (Người báo cáo / Reporters)
    const student01 = await User.create({
      userName: 'student01',
      password: hashedPassword,
      fullName: 'Sinh viên Nguyễn Văn Nam',
      role: 'student',
    });

    const student02 = await User.create({
      userName: 'student02',
      password: hashedPassword,
      fullName: 'Sinh viên Lê Thị Hoa',
      role: 'student',
    });

    console.log('✔ Đã tạo thành công 5 tài khoản mẫu.');

    // 4. Tạo 5 sự cố mẫu bao phủ đầy đủ các trạng thái và phòng ban
    console.log('🚨 Đang tạo danh sách sự cố mẫu (Incidents)...');
    await Incident.create([
      // Sự cố 1: PENDING - Kỹ thuật
      {
        title: 'Máy chiếu chập cháy bốc khói',
        location: 'Phòng học A302',
        type: 'Hỏng điện/Nước/Thiết bị',
        department: 'TECHNICAL',
        description:
          'Máy chiếu phát ra tiếng nổ lách tách, bốc mùi khét khi đang trong tiết học.',
        status: 'PENDING',
        reporter: student01._id,
      },
      // Sự cố 2: PENDING - Y tế
      {
        title: 'Học sinh ngã cầu thang chấn thương cổ chân',
        location: 'Cầu thang tầng 2 nhà B',
        type: 'Tai nạn/Sức khỏe/Cấp cứu',
        department: 'MEDICAL',
        description:
          'Học sinh bị trẹo chân sau khi bước hụt, sưng to và không tự đi lại được.',
        status: 'PENDING',
        reporter: student02._id,
      },
      // Sự cố 3: IN_PROGRESS - Kỹ thuật (tech01 đang xử lý)
      {
        title: 'Bồn nước tầng 2 rò rỉ ngập sàn',
        location: 'Khu vệ sinh nam tầng 2 nhà C',
        type: 'Hỏng điện/Nước/Thiết bị',
        department: 'TECHNICAL',
        description:
          'Van cấp nước bị gãy chốt, nước tràn ra sàn và chảy xuống hành lang lớp học.',
        status: 'IN_PROGRESS',
        reporter: student01._id,
        responder: tech01._id,
      },
      // Sự cố 4: RESOLVED - Kỹ thuật (tech01 đã giải quyết)
      {
        title: 'Điều hòa phòng Lab thực hành CNTT rỉ nước chập điện',
        location: 'Phòng Lab 501 nhà H',
        type: 'Hỏng điện/Nước/Thiết bị',
        department: 'TECHNICAL',
        description:
          'Dàn lạnh rỉ nước xuống ổ cắm sàn gây nhảy CB ngắt toàn bộ điện máy tính.',
        status: 'RESOLVED',
        reporter: student02._id,
        responder: tech01._id,
        resolutionNotes:
          'Đã thông tắc ống thoát nước ngưng, thay ổ cắm điện chống giật mới và kiểm tra an toàn toàn phòng máy.',
        resolvedAt: new Date(Date.now() - 3600000 * 2), // 2 giờ trước
      },
      // Sự cố 5: RESOLVED - Y tế (tech02 đã giải quyết)
      {
        title: 'Học sinh ngất do say nắng tại sân thể dục',
        location: 'Sân bóng rổ ngoài trời',
        type: 'Tai nạn/Sức khỏe/Cấp cứu',
        department: 'MEDICAL',
        description:
          'Học sinh choáng váng và xỉu trong giờ học thể dục ngoài trời nắng gắt.',
        status: 'RESOLVED',
        reporter: student01._id,
        responder: tech02._id,
        resolutionNotes:
          'Đã đưa vào phòng y tế, chườm mát trán và cổ, bù dung dịch điện giải Oresol. Sức khỏe học sinh đã hồi phục bình thường và về lại lớp.',
        resolvedAt: new Date(Date.now() - 3600000 * 5), // 5 giờ trước
      },
    ]);

    console.log('✔ Đã tạo thành công 5 sự cố mẫu với đầy đủ các trạng thái.');

    console.log('\n=======================================================');
    console.log('🎉 KHỞI TẠO DỮ LIỆU SEED THÀNH CÔNG RỰC RỠ!');
    console.log('=======================================================');
    console.log('Danh sách tài khoản mẫu (Mật khẩu chung cho tất cả: 123):');
    console.log(
      "1. Admin:        username: 'admin01'   | fullName: 'Quản trị viên hệ thống' | role: 'admin'"
    );
    console.log(
      "2. Dispatcher 1: username: 'tech01'    | fullName: 'Kỹ thuật viên Điện Nước'| role: 'dispatcher' (TECHNICAL)"
    );
    console.log(
      "3. Dispatcher 2: username: 'tech02'    | fullName: 'Nhân viên Y tế Học đường'| role: 'dispatcher' (MEDICAL)"
    );
    console.log(
      "4. Student 1:    username: 'student01' | fullName: 'Sinh viên Nguyễn Văn Nam'| role: 'student'"
    );
    console.log(
      "5. Student 2:    username: 'student02' | fullName: 'Sinh viên Lê Thị Hoa'    | role: 'student'"
    );
    console.log('=======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu (Seeding):', error);
    process.exit(1);
  }
}

seedData();
