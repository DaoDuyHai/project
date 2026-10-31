# ==============================================================================
# Stage 1: Dependencies Builder
# ==============================================================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Cài đặt công cụ biên dịch cho các thư viện C++ native (như bcrypt)
RUN apk add --no-cache python3 make g++

# Tận dụng Docker Layer Cache: Chỉ copy file manifest trước
COPY package.json package-lock.json ./

# Cài đặt chính xác các production dependencies, loại bỏ devDependencies và bỏ qua git hooks
RUN npm ci --omit=dev --ignore-scripts && npm rebuild bcrypt && npm cache clean --force

# ==============================================================================
# Stage 2: Production Runner (Lean, Secure & Non-root)
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Thiết lập biến môi trường chuẩn Production
ENV NODE_ENV=production \
    PORT=3000

# Tạo thư mục và cấp quyền sở hữu cho non-root user (node:node)
RUN chown -R node:node /app

# Sao chép node_modules đã tối ưu từ Stage 1
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

# Sao chép mã nguồn ứng dụng với quyền non-root
COPY --chown=node:node package.json ./
COPY --chown=node:node server.js seed.js ./
COPY --chown=node:node config/ ./config/
COPY --chown=node:node controllers/ ./controllers/
COPY --chown=node:node middlewares/ ./middlewares/
COPY --chown=node:node models/ ./models/
COPY --chown=node:node routes/ ./routes/
COPY --chown=node:node services/ ./services/
COPY --chown=node:node sockets/ ./sockets/
COPY --chown=node:node utils/ ./utils/

# Chuyển sang user non-root để tuân thủ nguyên tắc Least Privilege (Bảo mật container)
USER node

# Mở cổng lắng nghe dịch vụ
EXPOSE 3000

# Kiểm tra sức khỏe container định kỳ qua endpoint /health (Dùng wget tích hợp sẵn trong Alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3000/health || exit 1

# Khởi chạy ứng dụng
CMD ["node", "server.js"]

