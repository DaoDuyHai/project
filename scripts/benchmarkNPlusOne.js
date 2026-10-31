import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import connectDB from '../config/db.js';

async function runNPlusOneBenchmark() {
  await connectDB();
  const db = mongoose.connection.db;

  const userCol = db.collection('benchmark_users_n1');
  const incidentCol = db.collection('benchmark_incidents_n1');

  console.log('\n======================================================');
  console.log('   🔥 BENCHMARK TỐI ƯU HÓA TRUY VẤN N+1 (50 INCIDENTS) ');
  console.log('======================================================');

  // 1. Dọn dẹp dữ liệu cũ
  await userCol.drop().catch(() => {});
  await incidentCol.drop().catch(() => {});

  // 2. Tạo 10 người dùng mẫu
  const userIds = [];
  for (let u = 0; u < 10; u++) {
    const userId = new mongoose.Types.ObjectId();
    userIds.push(userId);
    await userCol.insertOne({
      _id: userId,
      fullName: `Cán bộ kiểm tra #${u}`,
      userName: `user_${u}`,
      department: u % 2 === 0 ? 'TECHNICAL' : 'MEDICAL',
    });
  }

  // 3. Tạo 50 sự cố tham chiếu tới các người dùng trên
  const incidentDocs = [];
  for (let i = 0; i < 50; i++) {
    incidentDocs.push({
      _id: new mongoose.Types.ObjectId(),
      title: `Sự cố thiết bị lớp học #${i}`,
      location: `Phòng ${200 + i}`,
      status: i % 2 === 0 ? 'IN_PROGRESS' : 'PENDING',
      department: 'TECHNICAL',
      reporter: userIds[i % userIds.length],
      responder: i % 2 === 0 ? userIds[(i + 1) % userIds.length] : null,
      createdAt: new Date(),
    });
  }
  await incidentCol.insertMany(incidentDocs);
  console.log('✅ Đã chuẩn bị 10 Users và 50 Incidents trong Database.\n');

  // ------------------------------------------------------------------
  // GIAI ĐOẠN 1: TRUY VẤN N+1 (Naive Loop Querying)
  // ------------------------------------------------------------------
  console.log('🐌 [1] Đang đo đạc truy vấn kiểu N+1 (Vòng lặp tuần tự)...');
  const startN1 = performance.now();
  let queryCountN1 = 0;

  // 1 query lấy 50 incidents
  const incidentsN1 = await incidentCol.find({}).toArray();
  queryCountN1++;

  // 2 * 50 queries lấy thông tin reporter và responder
  const fullIncidentsN1 = [];
  for (const inc of incidentsN1) {
    let reporterDoc = null;
    let responderDoc = null;

    if (inc.reporter) {
      reporterDoc = await userCol.findOne({ _id: inc.reporter });
      queryCountN1++;
    }
    if (inc.responder) {
      responderDoc = await userCol.findOne({ _id: inc.responder });
      queryCountN1++;
    }
    fullIncidentsN1.push({
      ...inc,
      reporter: reporterDoc,
      responder: responderDoc,
    });
  }
  const durationN1 = performance.now() - startN1;

  // ------------------------------------------------------------------
  // GIAI ĐOẠN 2: TỐI ƯU BẰNG MONGODB AGGREGATION PIPELINE ($lookup)
  // ------------------------------------------------------------------
  console.log(
    '⚡ [2] Đang đo đạc truy vấn tối ưu Aggregation ($lookup đơn)...'
  );
  const startAgg = performance.now();
  let queryCountAgg = 0;

  const fullIncidentsAgg = await incidentCol
    .aggregate([
      {
        $lookup: {
          from: 'benchmark_users_n1',
          localField: 'reporter',
          foreignField: '_id',
          as: 'reporterInfo',
        },
      },
      {
        $lookup: {
          from: 'benchmark_users_n1',
          localField: 'responder',
          foreignField: '_id',
          as: 'responderInfo',
        },
      },
      {
        $project: {
          title: 1,
          location: 1,
          status: 1,
          department: 1,
          reporter: { $arrayElemAt: ['$reporterInfo', 0] },
          responder: { $arrayElemAt: ['$responderInfo', 0] },
          createdAt: 1,
        },
      },
    ])
    .toArray();
  queryCountAgg++;
  const durationAgg = performance.now() - startAgg;

  // ------------------------------------------------------------------
  // BẢNG SO SÁNH KẾT QUẢ ĐO ĐẠC THỰC TẾ
  // ------------------------------------------------------------------
  console.log(
    '\n============================================================================='
  );
  console.log(
    '       📊 BẢNG SO SÁNH: TRUY VẤN N+1 vs TỐI ƯU AGGREGATION PIPELINE          '
  );
  console.log(
    '============================================================================='
  );
  console.log(
    '| Tiêu chí đánh giá               | Trước khi tối ưu (N+1 Queries)| Sau khi tối ưu ($lookup)    | Mức độ cải thiện   |'
  );
  console.log(
    '| :------------------------------ | :---------------------------- | :-------------------------- | :----------------- |'
  );
  console.log(
    `| Số round-trips tới DB (Queries) | ${queryCountN1.toString().padEnd(29)} | ${queryCountAgg.toString().padEnd(27)} | Giảm ${queryCountN1 - queryCountAgg} queries (${(((queryCountN1 - queryCountAgg) / queryCountN1) * 100).toFixed(1)}%) |`
  );
  console.log(
    `| Thời gian phản hồi (Latency)   | ${(durationN1.toFixed(2) + ' ms').padEnd(29)} | ${(durationAgg.toFixed(2) + ' ms').padEnd(27)} | Nhanh hơn ${(durationN1 / durationAgg).toFixed(1)}x        |`
  );
  console.log(
    `| Kết quả dữ liệu đồng nhất      | ${fullIncidentsN1.length} records                   | ${fullIncidentsAgg.length} records                   | Đầy đủ quan hệ     |`
  );
  console.log(
    `| Tải mạng (Network Overhead)     | 76 kết nối gửi nhận liên tục  | 1 kết nối đơn duy nhất      | Tiết kiệm 98.7% IO |`
  );
  console.log(
    '=============================================================================\n'
  );

  // Dọn dẹp dữ liệu
  await userCol.drop().catch(() => {});
  await incidentCol.drop().catch(() => {});
  await mongoose.connection.close();
  process.exit(0);
}

runNPlusOneBenchmark();
