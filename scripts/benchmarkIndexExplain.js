import mongoose from 'mongoose';
import connectDB from '../config/db.js';

async function runIndexExplainBenchmark() {
  await connectDB();
  const db = mongoose.connection.db;
  const collectionName = 'benchmark_incidents_explain';
  const collection = db.collection(collectionName);

  console.log('\n======================================================');
  console.log('   🔥 BENCHMARK INDEX & EXPLAIN() TRÊN 10,000 RECORDS  ');
  console.log('======================================================');

  // 1. Dọn dẹp collection test cũ
  await collection.drop().catch(() => {});

  // 2. Tạo 10,000 bản ghi mẫu
  console.log('⏳ Đang nạp 10,000 bản ghi dữ liệu sự cố mẫu...');
  const BATCH_SIZE = 2500;
  const TOTAL_RECORDS = 10000;
  const departments = ['TECHNICAL', 'MEDICAL'];
  const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

  for (let b = 0; b < TOTAL_RECORDS / BATCH_SIZE; b++) {
    const batch = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const idx = b * BATCH_SIZE + i;
      batch.push({
        title: `Sự cố thiết bị trường học số #${idx}`,
        location: `Phòng ${100 + (idx % 50)}`,
        type: 'Hỏng điện/Nước/Thiết bị',
        department: departments[idx % departments.length],
        status: statuses[idx % statuses.length],
        reporter: new mongoose.Types.ObjectId(),
        createdAt: new Date(Date.now() - idx * 60000),
      });
    }
    await collection.insertMany(batch);
  }
  console.log('✅ Đã nạp thành công 10,000 bản ghi!\n');

  const query = { status: 'PENDING', department: 'TECHNICAL' };
  const sort = { createdAt: -1 };

  // ------------------------------------------------------------------
  // GIAI ĐOẠN 1: TRƯỚC KHI ĐÁNH INDEX (COLLSCAN)
  // ------------------------------------------------------------------
  console.log('🔍 [1] Đang thực thi truy vấn TRƯỚC KHI CÓ INDEX...');
  const explainBefore = await collection
    .find(query)
    .sort(sort)
    .limit(10)
    .explain('executionStats');

  const statsBefore = explainBefore.executionStats;
  const executionStagesBefore = explainBefore.queryPlanner.winningPlan;

  // ------------------------------------------------------------------
  // GIAI ĐOẠN 2: TẠO COMPOUND INDEX { status: 1, department: 1, createdAt: -1 }
  // ------------------------------------------------------------------
  console.log(
    '⚙️ [2] Đang tạo Compound Index: { status: 1, department: 1, createdAt: -1 }...'
  );
  const startTimeIndex = Date.now();
  await collection.createIndex({ status: 1, department: 1, createdAt: -1 });
  const indexCreationTime = Date.now() - startTimeIndex;
  console.log(`✅ Index tạo xong sau ${indexCreationTime}ms!\n`);

  // ------------------------------------------------------------------
  // GIAI ĐOẠN 3: SAU KHI ĐÁNH INDEX (IXSCAN)
  // ------------------------------------------------------------------
  console.log('⚡ [3] Đang thực thi lại truy vấn SAU KHI CÓ INDEX...');
  const explainAfter = await collection
    .find(query)
    .sort(sort)
    .limit(10)
    .explain('executionStats');

  const statsAfter = explainAfter.executionStats;
  const executionStagesAfter = explainAfter.queryPlanner.winningPlan;

  // ------------------------------------------------------------------
  // TỔNG HỢP & IN KẾT QUẢ SO SÁNH
  // ------------------------------------------------------------------
  console.log(
    '\n============================================================================='
  );
  console.log(
    '       📊 BẢNG SO SÁNH HIỆU NĂNG TRUY VẤN: TRƯỚC vs SAU KHI ĐÁNH INDEX       '
  );
  console.log(
    '============================================================================='
  );
  console.log(
    '| Chỉ số đo lường (Metrics)      | Trước khi Index (COLLSCAN) | Sau khi Index (IXSCAN)      | Mức độ cải thiện   |'
  );
  console.log(
    '| :----------------------------- | :------------------------- | :-------------------------- | :----------------- |'
  );
  console.log(
    `| Chiến lược quét (Scan Stage)   | ${executionStagesBefore.stage.padEnd(26)} | ${executionStagesAfter.stage.padEnd(27)} | Bỏ qua quét toàn bộ|`
  );
  console.log(
    `| Số tài liệu quét (Docs Scanned)| ${statsBefore.totalDocsExamined.toString().padEnd(26)} | ${statsAfter.totalDocsExamined.toString().padEnd(27)} | Giảm ${(
      ((statsBefore.totalDocsExamined - statsAfter.totalDocsExamined) /
        statsBefore.totalDocsExamined) *
      100
    ).toFixed(1)}%        |`
  );
  console.log(
    `| Số key index quét (Keys)       | ${statsBefore.totalKeysExamined.toString().padEnd(26)} | ${statsAfter.totalKeysExamined.toString().padEnd(27)} | Quét đúng kết quả  |`
  );
  console.log(
    `| Thời gian thực thi (ms)        | ${(statsBefore.executionTimeMillis + ' ms').padEnd(26)} | ${(statsAfter.executionTimeMillis + ' ms').padEnd(27)} | Tăng tốc ~${Math.max(
      1,
      Math.round(
        (statsBefore.executionTimeMillis || 1) /
          (statsAfter.executionTimeMillis || 1)
      )
    )}x           |`
  );
  console.log(
    `| Sắp xếp trên RAM (In-Memory)   | ${explainBefore.queryPlanner.winningPlan.inputStage?.stage === 'SORT' ? 'CÓ (Tốn RAM server)     ' : 'KHÔNG                     '} | KHÔNG (Tận dụng B-Tree)     | Loại bỏ SORT in-RAM|`
  );
  console.log(
    '=============================================================================\n'
  );

  // Dọn dẹp collection thử nghiệm
  await collection.drop().catch(() => {});
  await mongoose.connection.close();
  process.exit(0);
}

runIndexExplainBenchmark();
