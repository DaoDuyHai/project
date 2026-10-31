import autocannon from 'autocannon';
import mongoose from 'mongoose';
import { httpServer } from '../server.js';
import { logger } from '../config/logger.js';

async function runBenchmark() {
  // Đợi kết nối MongoDB sẵn sàng
  while (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const port = process.env.PORT || 3000;
  const targetUrl = `http://localhost:${port}/health`;

  logger.info(
    `🔥 Bắt đầu kiểm thử tải (Load Test) bằng Autocannon vào: ${targetUrl}`
  );
  logger.info(
    '⚡ Cấu hình: 100 kết nối đồng thời (connections: 100), chạy liên tục 5 giây...'
  );

  try {
    const result = await autocannon({
      url: targetUrl,
      connections: 100,
      duration: 5,
      pipelining: 1,
    });

    console.log('\n======================================================');
    console.log('       📊 KẾT QUẢ ĐO HIỆU NĂNG BASELINE (AUTOCANNON)   ');
    console.log('======================================================');
    console.log(`- Target Endpoint:         ${targetUrl}`);
    console.log(`- Số kết nối đồng thời:    100 connections`);
    console.log(`- Tổng số request:         ${result.requests.total} requests`);
    console.log(
      `- Tốc độ xử lý (Req/sec):  ${Math.round(result.requests.average)} req/s (Max: ${result.requests.max})`
    );
    console.log(
      `- Throughput:              ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`
    );
    console.log('------------------------------------------------------');
    console.log('       ⏱️ CHI TIẾT ĐỘ TRỄ (LATENCY BENCHMARK)         ');
    console.log('------------------------------------------------------');
    console.log(`- Latency Trung bình:      ${result.latency.average} ms`);
    console.log(`- Latency p50 (Median):    ${result.latency.p50} ms`);
    console.log(`- Latency p90:             ${result.latency.p90} ms`);
    console.log(`- Latency p97.5:           ${result.latency.p97_5} ms`);
    console.log(`- Latency p99:             ${result.latency.p99} ms`);
    console.log(`- Latency Max:             ${result.latency.max} ms`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('Lỗi khi benchmark:', error);
  } finally {
    httpServer.close();
    process.exit(0);
  }
}

runBenchmark();
