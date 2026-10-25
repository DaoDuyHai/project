import "dotenv/config";
import { z } from "zod";

// Định nghĩa schema kiểm tra các biến môi trường
const envSchema = z.object({
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("3000"),
  MONGO_URI: z
    .string()
    .min(1, { message: "Thiếu hoặc chưa điền MONGO_URI trong file .env" }),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SECRET_KEY: z
    .string()
    .min(10, { message: "Ma khoa bi mat phai co it nhat 10 ki tu" }),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Cấu hình môi trường (.env) không hợp lệ:");
  console.error(z.treeifyError(parseResult.error));
  process.exit(1);
}

export const env = parseResult.data;
