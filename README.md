# 🏫 HỆ THỐNG ĐIỀU PHỐI & XỬ LÝ SỰ CỐ HỌC ĐƯỜNG
## (SCHOOL INCIDENT DISPATCH SYSTEM)

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.x-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Security](https://img.shields.io/badge/Auth-JWT_RBAC-FF6F00?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Postman](https://img.shields.io/badge/Postman-Collection_v2.1-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)

> **Backend RESTful API & Real-time Event Dispatching System**  
> Dự án Backend chuyên sâu xây dựng bởi **Đào Duy Hải** ([@DaoDuyHai](https://github.com/DaoDuyHai)).  
> Repository chính thức: [https://github.com/DaoDuyHai/project](https://github.com/DaoDuyHai/project)

---

## 📑 MỤC LỤC
1. [Kiến Trúc Hệ Thống & Luồng Dữ Liệu](#1-kiến-trúc-hệ-thống--luồng-dữ-liệu)
2. [Đặc Điểm Kỹ Thuật Nổi Bật (Key Engineering Highlights)](#2-đặc-điểm-kỹ-thuật-nổi-bật-key-engineering-highlights)
3. [Phân Hệ Người Dùng & Ma Trận Phân Quyền (RBAC)](#3-phân-hệ-người-dùng--ma-trận-phân-quyền-rbac)
4. [Vòng Đời Sự Cố & Cơ Chế Khóa Nguyên Tử Chống Race Condition](#4-vòng-đời-sự-cố--cơ-chế-khóa-nguyên-tử-chống-race-condition)
5. [Hệ Thống Real-Time Với Socket.io Rooms](#5-hệ-thống-real-time-với-socketio-rooms)
6. [Cấu Trúc Thư Mục Chuẩn MVC](#6-cấu-trúc-thư-mục-chuẩn-mvc)
7. [Danh Sách REST API Endpoints (11 Endpoints)](#7-danh-sách-rest-api-endpoints-11-endpoints)
8. [Hướng Dẫn Cài Đặt & Chạy Thử Nhanh Trong 60 Giây](#8-hướng-dẫn-cài-đặt--chạy-thử-nhanh-trong-60-giây)
9. [Bộ Kiểm Thử Postman Collection Chuyên Nghiệp (Auto-Token)](#9-bộ-kiểm-thử-postman-collection-chuyên-nghiệp-auto-token)
10. [Báo Cáo Kiểm Thử Tự Động (E2E Test Suite)](#10-báo-cáo-kiểm-thử-tự-động-e2e-test-suite)
11. [Lộ Trình Mở Rộng (Future Roadmap)](#11-lộ-trình-mở-rộng-future-roadmap)

---

## 1. KIẾN TRÚC HỆ THỐNG & LUỒNG DỮ LIỆU

> **Phạm vi đồ án:** Repository này là **mã nguồn Backend Core**. Các khối "Client (Dự kiến)" trong sơ đồ dưới đây mô tả các phân hệ người dùng trên giao diện để minh họa luồng luân chuyển dữ liệu thực tế.

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
   │   CLIENT: REPORTER     │         │   CLIENT: DISPATCHER   │         │     CLIENT: ADMIN      │
   │ (Học sinh / Giáo viên) │         │   (Kỹ thuật / Y tế)    │         │   (Ban Giám Hiệu)      │
   │                        │         │                        │         │                        │
   │ - Gửi báo cáo sự cố    │ Socket  │ - Nhận việc theo khoa  │ Socket  │ - Thống kê KPI, Top    │
   │ - Xem lịch sử cá nhân  │◄───────►│ - Khóa ca nguyên tử    │◄───────►│ - Lọc động & Phân trang│
   │ - Nhận thông báo live  │  Rooms  │ - Nghiệm thu hoàn thành│  Rooms  │ - Giám sát toàn trường │
   └────────────────────────┘         └────────────────────────┘         └────────────────────────┘
```

### Công nghệ sử dụng (Tech Stack)
| Thành phần | Công nghệ / Thư viện | Vai trò kỹ thuật |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ / ES Modules) | Nền tảng thực thi JavaScript phi đồng bộ (Non-blocking I/O) |
| **Web Framework**| Express.js v5.x | Xây dựng RESTful API, tự động bắt Promise Rejections trong Middleware |
| **Database** | MongoDB & Mongoose ODM | Lưu trữ tài liệu BSON, Aggregation Pipeline, Atomic Operations |
| **Real-time** | Socket.io v4.x | Giao tiếp WebSocket hai chiều phân kênh theo Rooms chuyên biệt |
| **Bảo mật** | JWT (JSON Web Token) & Bcrypt | Xác thực phi trạng thái (Stateless), băm mật khẩu 10 salt rounds |
| **Kiểm thử API**| Postman Collection v2.1 | 11 Endpoints + Script tự động trích xuất Token + Negative Tests |

---

## 2. ĐẶC ĐIỂM KỸ THUẬT NỔI BẬT (KEY ENGINEERING HIGHLIGHTS)

### 1. Khóa nguyên tử chống Race Condition (Atomic Concurrency Control)
- **Vấn đề thực tế:** Khi 2 hoặc nhiều kỹ thuật viên cùng bấm nhận 1 sự cố tại cùng một thời điểm, nếu dùng cơ chế kiểm tra trước rồi mới lưu (`find` rồi `save`), hệ thống sẽ bị xung đột tranh chấp (Race Condition).
- **Giải pháp:** Sử dụng thao tác nguyên tử ở tầng cơ sở dữ liệu MongoDB:
  ```javascript
  const updatedIncident = await Incident.findOneAndUpdate(
    { _id: incidentId, status: "PENDING" },
    { status: "IN_PROGRESS", responder: req.user.userId },
    { new: true }
  );
  if (!updatedIncident) {
    throw createHttpError("This incident has already been accepted by another responder.", 409);
  }
  ```
  Thao tác này đảm bảo chỉ duy nhất 1 nhân viên nhận thành công (`200 OK`), người đến sau nhận ngay mã lỗi `409 Conflict`.

### 2. Định tuyến sự kiện theo Room (Targeted Socket Routing)
- Thay vì phát sóng tràn lan (`broadcast`), hệ thống phân chia các Socket Rooms riêng biệt:
  - Sự cố Kỹ thuật $\rightarrow$ Chỉ gửi vào `department_TECHNICAL` và `room_admin`.
  - Sự cố Y tế $\rightarrow$ Chỉ gửi vào `department_MEDICAL` và `room_admin`.
  - Cập nhật trạng thái cá nhân $\rightarrow$ Gửi trực tiếp vào phòng riêng `user_${reporterId}`.
- Giúp giảm tải băng thông và bảo đảm tính bảo mật dữ liệu giữa các bộ phận.

### 3. Thống kê KPI bằng MongoDB Aggregation Pipeline
- Thay vì nạp toàn bộ danh sách bản ghi về tầng ứng dụng Node.js để tính toán bằng JavaScript, hệ thống tận dụng engine của MongoDB để lọc (`$match`), gom nhóm (`$group`), tính tổng (`$sum`), sắp xếp (`$sort`), lấy top (`$limit`) và định hình lại cấu trúc trường (`$project`), thực thi song song thông qua `Promise.all`:
  - Thống kê tỷ lệ ca theo trạng thái (Pending / In Progress / Resolved).
  - Phân bổ số ca theo từng phòng ban (Technical / Medical).
  - Top 3 vị trí điểm nóng thường xuyên xảy ra sự cố nhất trường.

### 4. Xử lý lỗi tập trung chuẩn Production (Centralized Error Handler)
- Bắt và chuẩn hóa toàn bộ lỗi hệ thống về một định dạng thống nhất `{ success: false, message: "..." }`.
- Phân loại chính xác các mã lỗi HTTP:
  - `CastError` (ID sai định dạng 24 hex ObjectId) $\rightarrow$ `400 Bad Request`.
  - `ValidationError` (Thiếu trường bắt buộc, sai Enum) $\rightarrow$ `400 Bad Request`.
  - Duplicate Key (`E11000`) $\rightarrow$ `409 Conflict`.
  - Sai cú pháp JSON body $\rightarrow$ `400 Bad Request`.

---

## 3. PHÂN HỆ NGƯỜI DÙNG & MA TRẬN PHÂN QUYỀN (RBAC)

| Vai trò (Role) | Phòng ban (Department) | Quyền hạn chính | Quy tắc kiểm soát truy cập |
| :--- | :--- | :--- | :---: |
| `student` / `teacher` | `GENERAL` | Báo cáo sự cố mới, Xem lịch sử báo cáo của chính mình | Chỉ truy cập route Reporter |
| `dispatcher` | `TECHNICAL` | Xem sự cố chờ (`/pending`), Nhận & Hoàn thành sự cố **Kỹ thuật** | Bị chặn `403` nếu thao tác ca Y tế |
| `dispatcher` | `MEDICAL` | Xem sự cố chờ (`/pending`), Nhận & Hoàn thành sự cố **Y tế** | Bị chặn `403` nếu thao tác ca Kỹ thuật |
| `admin` | — | Xem toàn bộ sự cố toàn trường, Xem Thống kê Analytics | Toàn quyền kiểm tra và giám sát |

> **Bảo mật quản trị tài khoản:** Trong môi trường thực tế, route công khai `/register` chỉ phục vụ tài khoản học sinh thông thường. Các tài khoản có quyền hạn cao (`dispatcher`, `admin`) được khởi tạo trước thông qua kịch bản Seed dữ liệu (`npm run seed`) nhằm đảm bảo an ninh hệ thống.

---

## 4. VÒNG ĐỜI SỰ CỐ & CƠ CHẾ KHÓA NGUYÊN TỬ CHỐNG RACE CONDITION

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

- **Chống nhận trùng việc (Race Condition):**
  - Thao tác đầu tiên khớp điều kiện `status: "PENDING"` sẽ cập nhật thành công (HTTP `200 OK`).
  - Thao tác thứ hai đến sau không còn tìm thấy trạng thái `"PENDING"`, lập tức trả về HTTP `409 Conflict`: *"This incident has already been accepted by another responder."*
- **Kiểm tra quyền sở hữu khi hoàn thành (Ownership Check):** Chỉ đúng kỹ thuật viên được ghi nhận trong trường `responder` mới có quyền chuyển trạng thái sang `RESOLVED` (HTTP `403 Forbidden` nếu người khác cố tình can thiệp).

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

## 6. CẤU TRÚC THƯ MỤC CHUẨN MVC

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
│   ├── userModel.js           # User Schema (Bcrypt hash, select: false trên password)
│   └── incidentModel.js       # Incident Schema (Mapping phòng ban, trạng thái Enum)
├── postman/
│   └── SchoolIncidentDispatch.postman_collection.json # File Postman Collection v2.1 hoàn chỉnh
├── routes/
│   ├── userRoutes.js          # Router /api/users
│   ├── incidentRoutes.js      # Router /api/incidents
│   └── adminRoutes.js         # Router /api/incidents (Admin list & analytics)
├── sockets/
│   └── incidentSocket.js      # Handshake auth token & phân bổ Socket Rooms
├── utils/
│   └── createHttpError.js     # Helper khởi tạo lỗi HTTP gắn statusCode
├── .env.example               # Mẫu biến môi trường an toàn để chia sẻ
├── .gitignore                 # Loại trừ node_modules, .env và file rác
├── package.json               # Cấu hình dự án, dependencies và scripts
├── seed.js                    # Kịch bản dọn dẹp & nạp dữ liệu mẫu tự động
└── server.js                  # Khởi chạy Express HTTP, CORS, Health-check & Socket.io
```

---

## 7. DANH SÁCH REST API ENDPOINTS (11 ENDPOINTS)

Tất cả phản hồi thành công đều tuân thủ cấu trúc envelope chuẩn mực:
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

## 8. HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ NHANH TRONG 60 GIÂY

### Bước 1: Clone mã nguồn về máy
```bash
git clone https://github.com/DaoDuyHai/project.git
cd project
```

### Bước 2: Cài đặt thư viện phụ thuộc
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và kiểm tra các thông số (kết nối MongoDB cục bộ hoặc chuỗi MongoDB Atlas):
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/school_dispatch
SECRET_KEY=your_super_secret_jwt_key_here
```

### Bước 4: Nạp dữ liệu mẫu tự động (Seeding)
Chạy script seed để tự động làm sạch database và tạo sẵn 5 tài khoản mẫu + 5 sự cố mẫu:
```bash
npm run seed
```
*Danh sách tài khoản mẫu sẵn sàng sử dụng (Mật khẩu mặc định chung: `123`):*
- **Admin:** `admin01` / mật khẩu: `123`
- **Kỹ thuật viên:** `tech01` / mật khẩu: `123` (Khoa: `TECHNICAL`)
- **Nhân viên Y tế:** `tech02` / mật khẩu: `123` (Khoa: `MEDICAL`)
- **Sinh viên 1:** `student01` / mật khẩu: `123`
- **Sinh viên 2:** `student02` / mật khẩu: `123`

### Bước 5: Khởi chạy Server
```bash
# Chạy ở chế độ phát triển (Auto-reload khi lưu file)
npm run dev

# Hoặc chạy ở chế độ chuẩn
npm start
```
Server sẽ chạy tại: `http://localhost:3000` (Kiểm tra health-check tại `GET http://localhost:3000/`).

---

## 9. BỘ KIỂM THỬ POSTMAN COLLECTION CHUYÊN NGHIỆP (AUTO-TOKEN)

Dự án cung cấp sẵn file cấu hình Postman hoàn chỉnh chuẩn Schema v2.1 tại:  
📁 [postman/SchoolIncidentDispatch.postman_collection.json](postman/SchoolIncidentDispatch.postman_collection.json)

### Điểm đặc biệt vượt trội của Postman Collection này:
1. **Cơ chế Auto-Token (Không cần copy-paste thủ công):**  
   Mỗi request Login trong folder `1. Authentication` đều tích hợp sẵn Test Script:
   ```javascript
   const jsonData = pm.response.json();
   const token = jsonData.token || (jsonData.data && jsonData.data.token);
   if (token) {
       pm.collectionVariables.set("token", token);
   }
   ```
   👉 Bạn chỉ cần bấm **Send** vào tài khoản muốn kiểm thử, mã Token sẽ tự động cập nhật vào biến collection `{{token}}` cho toàn bộ 11 request con!
2. **Tự động bắt `{{incidentId}}`:**  
   Khi tạo sự cố hoặc khi Dispatcher xem danh sách việc chờ, script tự động lưu ID sự cố vào biến `{{incidentId}}`. Bạn có thể bấm ngay request `Accept` và `Resolve` nối tiếp mà không cần copy ID bằng tay.
3. **Folder `5. RBAC Negative Tests` (Kiểm thử bảo mật):**  
   Bao gồm các test case kiểm tra việc chặn quyền (Sinh viên gọi API Admin/Dispatcher) với assertion tự động kiểm tra mã `403 Forbidden`.

---

## 10. BÁO CÁO KIỂM THỬ TỰ ĐỘNG (E2E TEST SUITE)

Toàn bộ hệ thống đã được kiểm thử toàn diện End-to-End với **17/17 Test Cases đạt tuyệt đối (100% Passed)**:

```text
🚀 KẾT QUẢ KIỂM THỬ TOÀN DIỆN E2E (Tech Lead Review):
  ✅ [PASS] GET / Health-check returns 200 OK
  ✅ [PASS] GET /api/unknown-endpoint returns 404 Route Not Found
  ✅ [PASS] POST /api/users/login (student01) returns token
  ✅ [PASS] POST /api/users/login (tech01) returns token
  ✅ [PASS] POST /api/users/login (admin01) returns token
  ✅ [PASS] GET /api/users/profile returns valid user data
  ✅ [PASS] POST /api/incidents creates incident (201 Created)
  ✅ [PASS] GET /api/incidents/my-reports returns list
  ✅ [PASS] GET /api/incidents/pending contains newly created incident
  ✅ [PASS] PATCH /api/incidents/:id/accept transitions status to IN_PROGRESS
  ✅ [PASS] PATCH /api/incidents/:id/accept duplicate attempt returns 409 Conflict
  ✅ [PASS] PATCH /api/incidents/:id/resolve transitions status to RESOLVED
  ✅ [PASS] GET /api/incidents (Admin) returns paginated list
  ✅ [PASS] GET /api/incidents/analytics returns aggregation KPI metrics
  ✅ [PASS] RBAC Security: Student calling Admin Analytics is blocked (403 Forbidden)
  ✅ [PASS] RBAC Security: Student calling Accept Incident is blocked (403 Forbidden)
  ✅ [PASS] Error Handler: Malformed ObjectId parameter returns 400 Bad Request

=======================================================
🏁 TỔNG KẾT: 17/17 TEST CASES PASSED (100% SUCCESS)
=======================================================
```

---

## 11. LỘ TRÌNH MỞ RỘNG (FUTURE ROADMAP)

- [ ] **In-app Real-time Chat:** Mở rộng Socket.io Room `incident_${id}` để người báo cáo và nhân viên phụ trách có thể trao đổi trực tiếp trong quá trình xử lý sự cố.
- [ ] **Đính kèm hình ảnh hiện trường (Media Upload):** Tích hợp Cloudinary hoặc AWS S3 để người báo cáo tải ảnh chụp hư hại.
- [ ] **Bổ sung phòng ban:** Thêm khoa `SECURITY` (Bảo vệ / An ninh trật tự học đường).
- [ ] **Xuất báo cáo định kỳ:** Hỗ trợ Admin xuất dữ liệu sự cố và số liệu thống kê ra file Excel / CSV.

---

### 👨‍💻 Tác giả
- **Đào Duy Hải**
- GitHub: [@DaoDuyHai](https://github.com/DaoDuyHai)
- Repository: [https://github.com/DaoDuyHai/project](https://github.com/DaoDuyHai/project)

```text
🚀 KẾT QUẢ KIỂM THỬ TOÀN DIỆN E2E (Tech Lead Review):
  ✅ [PASS] GET / Health-check returns 200 OK
  ✅ [PASS] GET /api/unknown-endpoint returns 404 Route Not Found
  ✅ [PASS] POST /api/users/login (student01) returns token
  ✅ [PASS] POST /api/users/login (tech01) returns token
  ✅ [PASS] POST /api/users/login (admin01) returns token
  ✅ [PASS] GET /api/users/profile returns valid user data
  ✅ [PASS] POST /api/incidents creates incident (201 Created)
  ✅ [PASS] GET /api/incidents/my-reports returns list
  ✅ [PASS] GET /api/incidents/pending contains newly created incident
  ✅ [PASS] PATCH /api/incidents/:id/accept transitions status to IN_PROGRESS
  ✅ [PASS] PATCH /api/incidents/:id/accept duplicate attempt returns 409 Conflict
  ✅ [PASS] PATCH /api/incidents/:id/resolve transitions status to RESOLVED
  ✅ [PASS] GET /api/incidents (Admin) returns paginated list
  ✅ [PASS] GET /api/incidents/analytics returns aggregation KPI metrics
  ✅ [PASS] RBAC Security: Student calling Admin Analytics is blocked (403 Forbidden)
  ✅ [PASS] RBAC Security: Student calling Accept Incident is blocked (403 Forbidden)
  ✅ [PASS] Error Handler: Malformed ObjectId parameter returns 400 Bad Request

=======================================================
🏁 TỔNG KẾT: 17/17 TEST CASES PASSED (100% SUCCESS)
=======================================================
```

---

## 11. LỘ TRÌNH MỞ RỘNG (FUTURE ROADMAP)

- [ ] **In-app Real-time Chat:** Mở rộng Socket.io Room `incident_${id}` để người báo cáo và nhân viên phụ trách có thể trao đổi trực tiếp trong quá trình xử lý sự cố.
- [ ] **Đính kèm hình ảnh hiện trường (Media Upload):** Tích hợp Cloudinary hoặc AWS S3 để người báo cáo tải ảnh chụp hư hại.
- [ ] **Bổ sung phòng ban:** Thêm khoa `SECURITY` (Bảo vệ / An ninh trật tự học đường).
- [ ] **Xuất báo cáo định kỳ:** Hỗ trợ Admin xuất dữ liệu sự cố và số liệu thống kê ra file Excel / CSV.

---

### 👨‍💻 Tác giả
- **Đào Duy Hải**
- GitHub: [@DaoDuyHai](https://github.com/DaoDuyHai)
- Repository: [https://github.com/DaoDuyHai/project](https://github.com/DaoDuyHai/project)

