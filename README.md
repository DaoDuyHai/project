# 🏫 HỆ THỐNG ĐIỀU PHỐI & XỬ LÝ SỰ CỐ HỌC ĐƯỜNG
## (SCHOOL INCIDENT DISPATCH SYSTEM)

[![CI Pipeline](https://github.com/DaoDuyHai/school-incident-dispatch/actions/workflows/ci.yml/badge.svg)](https://github.com/DaoDuyHai/school-incident-dispatch/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Fly.io-24185b?logo=flydotio&logoColor=white)](https://school-incident-dispatch.fly.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.x-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage_Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Vitest](https://img.shields.io/badge/Vitest-34%20Tests%20Passing-22c55e?logo=vitest&logoColor=white)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-Clean-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Security](https://img.shields.io/badge/Auth-JWT_RBAC-FF6F00?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Postman](https://img.shields.io/badge/Postman-Collection_v2.1-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)

> **Backend RESTful API & Real-time Event Dispatching System**  
> Xây dựng với **Node.js, Express 5, MongoDB (Mongoose), Socket.io và JWT RBAC**.  
> Tác giả: **Đào Duy Hải** ([@DaoDuyHai](https://github.com/DaoDuyHai))  
> Repository: [https://github.com/DaoDuyHai/school-incident-dispatch](https://github.com/DaoDuyHai/school-incident-dispatch)  
> 🌐 **Live Demo (Production):** [https://school-incident-dispatch.fly.dev](https://school-incident-dispatch.fly.dev)  
> 🩺 **Health Check Diagnostics:** [https://school-incident-dispatch.fly.dev/health](https://school-incident-dispatch.fly.dev/health)

---

## 📑 MỤC LỤC
1. [Kiến Trúc Tổng Quan](#1-kiến-trúc-tổng-quan)
2. [Đặc Điểm Kỹ Thuật Nổi Bật](#2-đặc-điểm-kỹ-thuật-nổi-bật)
3. [Phân Hệ Người Dùng & Ma Trận Phân Quyền (RBAC)](#3-phân-hệ-người-dùng--ma-trận-phân-quyền-rbac)
4. [Vòng Đời Sự Cố & Cơ Chế Kiểm Soát Tranh Chấp (Concurrency Control)](#4-vòng-đời-sự-cố--cơ-chế-kiểm-soát-tranh-chấp-concurrency-control)
5. [Hệ Thống Real-Time Với Socket.io Rooms](#5-hệ-thống-real-time-với-socketio-rooms)
6. [Cấu Trúc Thư Mục MVC](#6-cấu-trúc-thư-mục-mvc)
7. [Danh Sách REST API Endpoints (11 Endpoints)](#7-danh-sách-rest-api-endpoints-11-endpoints)
8. [Hướng Dẫn Cài Đặt & Chạy Thử Nhanh](#8-hướng-dẫn-cài-đặt--chạy-thử-nhanh)
9. [Kiểm Thử Tự Động & CI/CD Pipeline (Vitest + GitHub Actions)](#9-kiểm-thử-tự-động--cicd-pipeline-vitest--github-actions)
10. [Kiểm Thử Qua Postman Collection (Auto-Token)](#10-kiểm-thử-qua-postman-collection-auto-token)
11. [Lộ Trình Mở Rộng (Future Roadmap)](#11-lộ-trình-mở-rộng-future-roadmap)

---

## 1. KIẾN TRÚC TỔNG QUAN

> **Lưu ý:** Repository này là **mã nguồn Backend**. Các khối "Client (Dự kiến)" trong sơ đồ dưới đây mô tả các phân hệ người dùng trên giao diện để minh họa luồng luân chuyển dữ liệu thực tế.

```text
                             ┌──────────────────────────────────────────────┐
                             │          NODE.JS & EXPRESS 5 BACKEND         │
                             │  - RESTful APIs (Auth, Incidents, Analytics) │
                             │  - Socket.io (Room-based Event Dispatching)  │
                             │  - Multi-tier RBAC Guards (401 / 403)        │
                             │  - MongoDB Aggregation Pipeline Queries      │
                             └──────────────────────┬───────────────────────┘
                                                    │
               ┌────────────────────────────────────┼────────────────────────────────────┐
               ▼                                    ▼                                    ▼
   ┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
   │    CLIENT: REPORTER    │         │   CLIENT: DISPATCHER   │         │     CLIENT: ADMIN      │
   │ (Học sinh / Giáo viên) │         │   (Kỹ thuật / Y tế)    │         │   (Ban Giám Hiệu)      │
   │                        │         │                        │         │                        │
   │ - Tạo & Gửi sự cố mới  │ Socket  │ - Nhận ca theo khoa    │ Socket  │ - Thống kê KPI, Top    │
   │ - Xem lịch sử cá nhân  │◄───────►│ - Khóa ca nguyên tử    │◄───────►│ - Lọc động & Phân trang│
   │ - Nhận thông báo live  │  Rooms  │ - Nghiệm thu hoàn thành│  Rooms  │ - Giám sát toàn trường │
   └────────────────────────┘         └────────────────────────┘         └────────────────────────┘
```

### Công nghệ sử dụng
| Thành phần | Công nghệ / Thư viện | Vai trò kỹ thuật |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ / ES Modules) | Môi trường thực thi phi đồng bộ |
| **Framework** | Express.js v5.x | Xây dựng RESTful API và Middleware Pipeline |
| **Database** | MongoDB & Mongoose ODM | Lưu trữ tài liệu BSON, Aggregation Pipeline |
| **Real-time** | Socket.io v4.x | Giao tiếp hai chiều WebSocket dựa trên Room |
| **Bảo mật** | JWT (JSON Web Token) & Bcrypt | Cấp token phi trạng thái, băm mật khẩu 10 salt rounds |
| **Containerization** | Docker & Docker Compose | Multi-stage build (Alpine), chạy non-root `node:node`, kiểm tra sức khỏe tự động |
| **Kiểm thử tự động**| Vitest, Supertest, V8 Coverage | Bộ 34 test cases (Unit, Service Mock, Integration, Concurrency, Socket Rooms) |
| **Kiểm thử API**| Postman Collection v2.1 | Danh mục request mẫu sẵn sàng import để kiểm thử |

---

## 2. ĐẶC ĐIỂM KỸ THUẬT NỔI BẬT

1. **Khóa nguyên tử chống Race Condition (Atomic Concurrency Control):**
   - Tránh xung đột khi nhiều nhân viên cùng bấm nhận một sự cố tại cùng một thời điểm bằng thao tác nguyên tử MongoDB: `findOneAndUpdate({ _id, status: 'PENDING' }, { status: 'IN_PROGRESS', responder: userId })`. Nếu ca đã được tiếp nhận trước đó, hệ thống trả về mã `409 Conflict`.
2. **Định tuyến thông báo theo Room (Targeted Socket Routing):**
   - Phân chia kênh phát sóng qua Socket.io: Sự cố kỹ thuật gửi vào `department_TECHNICAL`, sự cố y tế gửi vào `department_MEDICAL`, sự kiện hệ thống gửi vào `room_admin`, và thông báo trạng thái riêng gửi về `user_${reporterId}`.
3. **Thống kê số liệu bằng MongoDB Aggregation Pipeline:**
   - Sử dụng các giai đoạn `$match`, `$group`, `$sort`, `$limit` và `$project` thực thi trực tiếp trên database engine thông qua `Promise.all` song song, giảm tải việc nạp dữ liệu thô về Node.js.
4. **Phân trang và lọc động (Pagination & Dynamic Filtering):**
   - Áp dụng phân trang theo offset `.skip(skip).limit(limitNumber)` kết hợp `countDocuments` để đếm tổng số bản ghi và tính toán `totalPages`, giúp giảm tải dung lượng phản hồi cho Client.
5. **Xử lý lỗi tập trung chuẩn Production (Centralized Error Handler):**
   - Chuẩn hóa toàn bộ phản hồi lỗi về `{ success: false, message }`, tự động phân loại `CastError` (400), `ValidationError` (400), trùng lặp dữ liệu `E11000` (409) và lỗi cú pháp JSON.

---

## 3. PHÂN HỆ NGƯỜI DÙNG & MA TRẬN PHÂN QUYỀN (RBAC)

| Vai trò (Role) | Phòng ban (Department) | Quyền hạn chính | Quy định truy cập |
| :--- | :--- | :--- | :---: |
| `student` / `teacher` | `GENERAL` | Báo cáo sự cố, Xem danh sách sự cố của chính mình | Chỉ truy cập route Reporter |
| `dispatcher` | `TECHNICAL` | Xem sự cố chờ (`/pending`), Nhận & Hoàn thành sự cố **Kỹ thuật** | Bị chặn `403` nếu thao tác ca Y tế |
| `dispatcher` | `MEDICAL` | Xem sự cố chờ (`/pending`), Nhận & Hoàn thành sự cố **Y tế** | Bị chặn `403` nếu thao tác ca Kỹ thuật |
| `admin` | — | Xem toàn bộ sự cố toàn trường, Xem Thống kê Analytics | Toàn quyền kiểm tra và giám sát |

> **Lưu ý về quản trị tài khoản:** Trong môi trường thực tế, route công khai `/register` chỉ phục vụ tài khoản học sinh / giáo viên thông thường. Các tài khoản có quyền hạn đặc biệt (`dispatcher`, `admin`) được khởi tạo trước thông qua kịch bản Seed dữ liệu (`npm run seed`) nhằm đảm bảo tính bảo mật.

---

## 4. VÒNG ĐỜI SỰ CỐ & CƠ CHẾ KIỂM SOÁT TRANH CHẤP (CONCURRENCY CONTROL)

```text
   Reporter tạo sự cố
          │
          ▼
   ┌──────────────┐     Dispatcher bấm      ┌──────────────┐     Dispatcher bấm     ┌──────────────┐
   │   PENDING    │ ──── "Nhận việc"  ────► │ IN_PROGRESS  │ ──── "Hoàn thành" ───► │   RESOLVED   │
   │  (Chờ nhận)  │    (Atomic Lock)        │ (Đang xử lý) │   (Check Ownership)    │  (Đã xong)   │
   └──────────────┘                         └──────────────┘                        └──────────────┘
         │                                         │                                       │
         ▼ Socket.io                               ▼ Socket.io                             ▼ Socket.io
   - department_${dept}                      - user_${reporterId}                    - user_${reporterId}
   - room_admin                              - room_admin                            - room_admin
   - user_${reporterId}                      - department_${dept}                    
```

- **Xung đột nhận việc (Race Condition):** Khi 2 kỹ thuật viên cùng bấm nhận 1 sự cố tại cùng một thời điểm:
  - Thao tác đầu tiên khớp điều kiện `status: "PENDING"` sẽ cập nhật thành công (HTTP `200 OK`).
  - Thao tác thứ hai không còn tìm thấy trạng thái `"PENDING"` tương ứng, trả về HTTP `409 Conflict` với thông báo: *"This incident has already been accepted by another responder."*
- **Kiểm tra quyền hoàn thành (Ownership Check):** Chỉ đúng kỹ thuật viên được ghi nhận trong trường `responder` mới có quyền chuyển trạng thái sang `RESOLVED` (HTTP `403 Forbidden` nếu người khác cố tình thao tác).

---

## 5. HỆ THỐNG REAL-TIME VỚI SOCKET.IO ROOMS

Hệ thống sử dụng các Room cố định, đồng bộ chính xác giữa Socket Middleware và Controllers:
- Phòng theo khoa: `department_TECHNICAL`, `department_MEDICAL`
- Phòng ban quản trị: `room_admin`
- Phòng cá nhân người dùng: `user_${userId}`

| Tên sự kiện (Event Name) | Nơi phát ra (Trigger) | Phòng nhận tin (Rooms) | Gói tin kèm theo (Payload) | Tác động dự kiến phía Client (UI State) |
| :--- | :--- | :--- | :--- | :--- |
| **`incident:created`** | Sau khi `POST /api/incidents` thành công | `department_${dept}`, `room_admin`, `user_${reporterId}` | `{ message, data: newIncident }` | Dispatcher và Admin nhận sự cố mới trên đầu danh sách; Reporter nhận phản hồi xác nhận |
| **`incident:accepted`** | Sau khi `PATCH /:id/accept` thành công | `user_${reporterId}`, `department_${dept}`, `room_admin` | `{ message, data: updatedIncident }` | Reporter thấy trạng thái đổi sang `IN_PROGRESS`; Dispatcher khác thấy sự cố đã được tiếp nhận |
| **`incident:resolved`** | Sau khi `PATCH /:id/resolve` thành công | `user_${reporterId}`, `room_admin` | `{ message, data: updatedIncident }` | Reporter thấy trạng thái đổi sang `RESOLVED`; Admin cập nhật kết quả xử lý |

---

## 6. CẤU TRÚC THƯ MỤC MVC

```text
SchoolIncidentDispatch/
├── config/
│   └── db.js                  # Kết nối MongoDB qua Mongoose ODM
├── controllers/
│   ├── userController.js      # Đăng ký, Đăng nhập, Xem thông tin cá nhân
│   ├── incidentController.js  # Nghiệp vụ sự cố (Tạo, Nhận nguyên tử, Hoàn thành)
│   └── adminController.js     # Lọc động & Phân trang, Thống kê Aggregation Pipeline
├── middlewares/
│   ├── authMiddleware.js      # Xác thực Bearer JWT Token + Phân quyền authorizeRoles
│   └── errorHandler.js        # Bắt và định dạng lỗi tập trung (CastError, ValidationError)
├── models/
│   ├── userModel.js           # User Schema (Mã hóa bcrypt, phân quyền role & department)
│   └── incidentModel.js       # Incident Schema (Mapping phòng ban, trạng thái Enum)
├── postman/
│   └── SchoolIncidentDispatch.postman_collection.json # File Postman Collection v2.1 (11 endpoints)
├── routes/
│   ├── userRoutes.js          # Router /api/users
│   ├── incidentRoutes.js      # Router /api/incidents
│   └── adminRoutes.js         # Router /api/incidents (Admin list & analytics)
├── sockets/
│   └── incidentSocket.js      # Handshake auth token & phân bổ Socket Rooms
├── utils/
│   └── createHttpError.js     # Helper khởi tạo lỗi HTTP có gắn statusCode
├── .env.example               # Mẫu cấu hình biến môi trường
├── .gitignore                 # Loại trừ node_modules và file .env
├── package.json               # Khai báo dependencies và scripts
├── seed.js                    # Kịch bản khởi tạo tài khoản và sự cố mẫu
├── server.js                  # Điểm khởi chạy: Tích hợp Express HTTP và Socket.io
└── README.md                  # Tài liệu hướng dẫn kỹ thuật
```

---

## 7. DANH SÁCH REST API ENDPOINTS (11 ENDPOINTS)

Mọi phản hồi thành công đều tuân thủ cấu trúc chuẩn:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### 🔐 Phân hệ Xác thực (3 Endpoints)
| Method | Endpoint | Mô tả | Quyền hạn |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/users/register` | Đăng ký tài khoản người dùng mới | Public |
| `POST` | `/api/users/login` | Đăng nhập hệ thống, nhận JWT Token (thời hạn 1 ngày) | Public |
| `GET` | `/api/users/profile` | Xem thông tin tài khoản đang đăng nhập | Đã xác thực |

### 🚨 Phân hệ Sự cố & Điều phối (6 Endpoints)
| Method | Endpoint | Mô tả | Quyền hạn |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/incidents` | Báo cáo sự cố mới (+ Socket.io broadcast theo khoa) | `student`, `teacher` |
| `GET` | `/api/incidents/my-reports` | Xem danh sách sự cố do chính mình gửi | `student`, `teacher` |
| `GET` | `/api/incidents/pending` | Xem sự cố chờ tiếp nhận đúng khoa chuyên môn | `dispatcher` |
| `GET` | `/api/incidents/my-tasks` | Xem các sự cố do chính mình đang/đã xử lý | `dispatcher` |
| `PATCH` | `/api/incidents/:id/accept` | Tiếp nhận sự cố (Khóa nguyên tử chống tranh chấp) | `dispatcher` |
| `PATCH` | `/api/incidents/:id/resolve` | Bấm hoàn thành sự cố (Kiểm tra quyền sở hữu) | `dispatcher` (người nhận) |

### 📊 Phân hệ Quản trị & Thống kê (2 Endpoints)
| Method | Endpoint | Mô tả | Quyền hạn |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/incidents` | Xem toàn bộ sự cố (`?status=&department=&page=&limit=`) | `admin` |
| `GET` | `/api/incidents/analytics` | Thống kê KPI, Tỷ lệ khoa, Top 3 điểm nóng (Aggregation) | `admin` |

---

## 8. HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ NHANH

### Cách 1: Khởi chạy siêu tốc bằng Docker Compose (Khuyến nghị 🚀)
Hệ thống hỗ trợ đóng gói container đa tầng (**Multi-stage Dockerfile**, chạy dưới quyền non-root `node:node`, kiểm tra sức khỏe tự động qua `/health`). Chỉ cần duy nhất 1 câu lệnh để dựng toàn bộ Backend và cơ sở dữ liệu MongoDB:

```bash
# 1. Dựng và khởi chạy App + MongoDB 6.0 dưới dạng background containers
docker-compose up -d --build

# 2. Khởi tạo dữ liệu mẫu (Seeding vào MongoDB container)
docker-compose run --rm app node seed.js

# 3. Kiểm tra trạng thái sức khỏe của các container
docker-compose ps
curl http://localhost:3000/health
```
> Khi muốn dừng hệ thống: `docker-compose down` (Dữ liệu database được lưu bền vững tại named volume `mongo_data`).

---

### Cách 2: Khởi chạy trực tiếp trên máy Host (Local Node.js)

#### Bước 1: Clone repository về máy
```bash
git clone https://github.com/DaoDuyHai/school-incident-dispatch.git
cd school-incident-dispatch
```

#### Bước 2: Cài đặt các thư viện phụ thuộc
```bash
npm install
```

#### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và kiểm tra các thông số (kết nối MongoDB local hoặc MongoDB Atlas):
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/school_dispatch
SECRET_KEY=your_jwt_secret_key_here
```

#### Bước 4: Khởi tạo dữ liệu mẫu (Seeding)
Chạy script seed để tự động dọn sạch database và nạp sẵn 5 tài khoản mẫu kèm 5 sự cố mẫu bao phủ mọi trạng thái:
```bash
npm run seed
```
*Tài khoản mẫu được tạo tự động (Mật khẩu mặc định chung: `123`):*
- **Admin:** `admin01` / mật khẩu: `123`
- **Kỹ thuật viên:** `tech01` / mật khẩu: `123` (Khoa: `TECHNICAL`)
- **Nhân viên Y tế:** `tech02` / mật khẩu: `123` (Khoa: `MEDICAL`)
- **Sinh viên 1:** `student01` / mật khẩu: `123`
- **Sinh viên 2:** `student02` / mật khẩu: `123`

#### Bước 5: Khởi chạy Server
```bash
# Chạy ở chế độ phát triển (Tự động tải lại khi đổi code)
npm run dev

# Chạy ở chế độ thông thường
npm start
```
Server sẽ chạy tại `http://localhost:3000` (Kiểm tra health-check tại `GET http://localhost:3000/health`).

---

## 9. KIỂM THỬ TỰ ĐỘNG & CI/CD PIPELINE (VITEST + GITHUB ACTIONS)

Dự án áp dụng bộ kiểm thử tự động toàn diện với **34/34 Test Cases** bao phủ từ Health Check, Unit test logic thuần, Mock Service Layer, Integration test quy trình hoàn chỉnh, Stress test Race Condition đến Socket.io Room Isolation:

### 🧪 Danh mục Test Suites (34 Test Cases)
| Suite | Phân loại | Kỹ thuật / Phạm vi kiểm thử | Số tests | Thời gian |
| :--- | :--- | :--- | :---: | :---: |
| [`healthCheck.test.js`](tests/healthCheck.test.js) | **System Diagnostics** | Kiểm tra `/health` (Readiness Probe 200/503), đo lường Uptime và Memory usage | 3 tests | ~35ms |
| [`createHttpError.test.js`](tests/createHttpError.test.js) | **Unit Test** | Pure function edge-cases, validation, status coercion, throw/catch error handling | 10 tests | ~17ms |
| [`incidentService.test.js`](tests/incidentService.test.js) | **Service Unit Test** | Mocking toàn bộ tầng DB Mongoose (`vi.mock`), kiểm thử nghiệp vụ độc lập không cần DB | 10 tests | ~15ms |
| [`incidentIntegration.test.js`](tests/incidentIntegration.test.js) | **Integration Test** | Supertest + MongoDB: Luồng nghiệp vụ chuẩn (Login $\rightarrow$ Report $\rightarrow$ Accept $\rightarrow$ Resolve) | 7 tests | ~2.5s |
| [`raceCondition.test.js`](tests/raceCondition.test.js) | **Concurrency Stress Test** | `Promise.all` 10 request đồng thời nhận cùng 1 sự cố (Kỳ vọng: Đúng 1×200 OK và 9×409 Conflict) | 1 test | ~1.5s |
| [`socketIsolation.test.js`](tests/socketIsolation.test.js) | **Real-time Isolation Test** | `socket.io-client`: Từ chối handshake không token, cách ly phân luồng Room theo Khoa kỹ thuật / y tế / admin | 3 tests | ~330ms |

### 🚀 Lệnh thực thi kiểm thử
```bash
# Chạy toàn bộ 34 test
npm test

# Chạy test và xuất báo cáo độ phủ mã nguồn (Code Coverage bằng V8 engine)
npm run test:coverage

# Chạy kiểm tra quy chuẩn mã nguồn tĩnh (ESLint)
npm run lint
```

### ⚙️ Quy trình CI/CD với GitHub Actions (`.github/workflows/ci.yml`)
Mỗi khi có commit được `push` hoặc tạo `pull_request` vào nhánh `main`:
1. **Dịch vụ Container MongoDB độc lập:** GitHub Actions runner (`ubuntu-latest`) tự động khởi chạy Docker container `mongo:6.0` tại cổng `27017` với health-check sẵn sàng.
2. **Khởi tạo môi trường Node.js:** Cài đặt Node.js 20.x và tối ưu hóa thời gian build với bộ đệm phụ thuộc (`cache: 'npm'`).
3. **Cài đặt dependencies:** Chạy `npm ci` đảm bảo tính toàn vẹn phiên bản package.
4. **Kiểm tra chuẩn mã nguồn:** Tự động quét lỗi cú pháp và biến không dùng bằng `npm run lint`.
5. **Chạy toàn bộ Test Suites:** Tự động thực thi `npm run test:coverage` (34 tests pass) và tính toán độ phủ code.
6. **Cập nhật Badge tự động:** Huy hiệu CI Status trên đầu README tự động chuyển sang màu xanh lá (`passing`).
7. **Tự động Triển khai lên Production (Continuous Deployment):** Nếu toàn bộ test vượt qua thành công, GitHub Actions tự động kết nối qua `FLY_API_TOKEN`, đóng gói Dockerfile và triển khai phiên bản mới nhất lên Fly.io (`https://school-incident-dispatch.fly.dev`) với cơ chế Zero-downtime rolling update. Nếu có bất kỳ test nào thất bại, quy trình deploy lập tức bị hủy bỏ để bảo vệ server production.

---

## 10. KIỂM THỬ QUA POSTMAN COLLECTION (AUTO-TOKEN)

Dự án đính kèm sẵn file cấu hình Postman hoàn chỉnh tại:  
📁 [postman/SchoolIncidentDispatch.postman_collection.json](postman/SchoolIncidentDispatch.postman_collection.json)

1. Mở Postman $\rightarrow$ Chọn **Import** $\rightarrow$ Chọn file `.json` trên.
2. Bộ sưu tập cấu hình sẵn **Authorization cấp Collection**, biến môi trường `{{baseUrl}}` và `{{token}}`.
3. **Cơ chế Auto-Token thông minh:** Mỗi request Login trong folder `1. Authentication` đều tích hợp sẵn Test Script tự động bắt và lưu `token` vào biến collection. Bạn chỉ cần bấm **Send** vào tài khoản muốn kiểm thử, token sẽ tự động cập nhật cho toàn bộ API mà không cần sao chép thủ công.
4. **Tự động lưu `{{incidentId}}`:** Khi tạo sự cố hoặc khi Dispatcher xem danh sách chờ, ID sự cố được tự động lưu để bạn bấm ngay request `Accept` và `Resolve` mà không cần copy ID bằng tay.
5. **Folder `5. RBAC Negative Tests`:** Cung cấp sẵn các kịch bản kiểm thử bảo mật (Student cố tình gọi API Admin/Dispatcher) với assertion tự động xác thực mã lỗi `403 Forbidden`.

---

## 11. LỘ TRÌNH MỞ RỘNG (FUTURE ROADMAP)

- [ ] **In-app Real-time Chat:** Mở rộng Socket.io Room `incident_${id}` để người báo cáo và nhân viên phụ trách có thể trao đổi trực tiếp khi đang xử lý sự cố.
- [ ] **Đính kèm hình ảnh (Media Upload):** Tích hợp Cloudinary hoặc AWS S3 để người báo có thể gửi ảnh chụp hiện trường hư hại.
- [ ] **Mở rộng phòng ban:** Bổ sung thêm khoa `SECURITY` (Bảo vệ / An ninh trật tự).
- [ ] **Xuất báo cáo:** Hỗ trợ Admin xuất dữ liệu sự cố và thống kê định dạng Excel / CSV.

---

### 👨‍💻 Tác giả
- **Đào Duy Hải**
- GitHub: [@DaoDuyHai](https://github.com/DaoDuyHai)
- Repository: [https://github.com/DaoDuyHai/school-incident-dispatch](https://github.com/DaoDuyHai/school-incident-dispatch)
