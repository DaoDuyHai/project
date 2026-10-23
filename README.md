# 🏫 HỆ THỐNG ĐIỀU PHỐI & XỬ LÝ SỰ CỐ HỌC ĐƯỜNG
## (SCHOOL INCIDENT DISPATCH SYSTEM)

> **Backend RESTful API & Real-time Event Dispatching System**  
> Xây dựng với **Node.js, Express 5, MongoDB (Mongoose), Socket.io và JWT RBAC**.

---

## 📑 MỤC LỤC
1. [Kiến Trúc Tổng Quan](#1-kiến-trúc-tổng-quan)
2. [Đặc Điểm Kỹ Thuật Nổi Bật](#2-đặc-điểm-kỹ-thuật-nổi-bật)
3. [Phân Hệ Người Dùng & Ma Trận Phân Quyền (RBAC)](#3-phân-hệ-người-dùng--ma-trận-phân-quyền-rbac)
4. [Vòng Đời Sự Cố & Cơ Chế Kiểm Soát Tranh Chấp (Concurrency Control)](#4-vòng-đời-sự-cố--cơ-chế-kiểm-soát-tranh-chấp-concurrency-control)
5. [Hệ Thống Real-Time Với Socket.io Rooms](#5-hệ-thống-real-time-với-socketio-rooms)
6. [Cấu Trúc Thư Mục Chuẩn MVC](#6-cấu-trúc-thư-mục-chuẩn-mvc)
7. [Danh Sách REST API Endpoints (11 Endpoints)](#7-danh-sách-rest-api-endpoints-11-endpoints)
8. [Hướng Dẫn Cài Đặt & Chạy Thử](#8-hướng-dẫn-cài-đặt--chạy-thử)
9. [Lộ Trình Mở Rộng Tương Lai (Future Roadmap)](#9-lộ-trình-mở-rộng-tương-lai-future-roadmap)

---

## 1. KIẾN TRÚC TỔNG QUAN

> **Lưu ý:** Repository này là **mã nguồn Backend**. Các khối "Client (Dự kiến)" trong sơ đồ dưới đây mô tả các phân hệ người dùng trên giao diện để minh họa luồng luân chuyển dữ liệu thực tế.

```
                             ┌──────────────────────────────────────────────┐
                             │          NODE.JS & EXPRESS 5 BACKEND         │
                             │  - RESTful APIs (Auth, Incidents, Analytics) │
                             │  - Socket.io (Room-based Event Dispatching)  │
                             │  - Multi-tier RBAC (401 / 403 Guards)        │
                             │  - MongoDB Aggregation Pipeline Queries      │
                             └──────────────────────┬───────────────────────┘
                                                    │
               ┌────────────────────────────────────┼────────────────────────────────────┐
               ▼                                    ▼                                    ▼
   ┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
   │  CLIENT: REPORTER      │         │  CLIENT: DISPATCHER    │         │  CLIENT: ADMIN         │
   │  (Giáo viên / Học sinh)│         │  (Kỹ thuật / Y tế)     │         │  (Ban Giám Hiệu)       │
   │                        │         │                        │         │                        │
   │ - Tạo & Gửi sự cố mới  │ Socket  │ - Nhận ca theo khoa    │ Socket  │ - Thống kê Aggregation │
   │ - Xem lịch sử cá nhân  │◄───────►│ - Khóa ca nguyên tử    │◄───────►│ - Lọc động & Phân trang│
   │ - Nhận thông báo live  │  Rooms  │ - Nghiệm thu hoàn thành│  Rooms  │ - Giám sát toàn trường │
   └────────────────────────┘         └────────────────────────┘         └────────────────────────┘
```

### Công nghệ sử dụng
| Thành phần | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v20+ / ES Modules) | Môi trường thực thi phi đồng bộ |
| **Framework** | Express.js v5.x | Xây dựng RESTful API và Middleware Pipeline |
| **Database** | MongoDB & Mongoose ODM | Lưu trữ tài liệu BSON, Aggregation Pipeline |
| **Real-time** | Socket.io v4.x | Giao tiếp hai chiều WebSocket dựa trên Room |
| **Bảo mật** | JWT (JSON Web Token) & Bcrypt | Cấp token phi trạng thái, băm mật khẩu (10 salt rounds) |
| **Kiểm thử API**| Postman Collection v2.1 | Danh mục request mẫu sẵn sàng import để kiểm thử |

---

## 2. ĐẶC ĐIỂM KỸ THUẬT NỔI BẬT

1. **Khóa nguyên tử chống Race Condition (Atomic Concurrency Control):**
   - Tránh xung đột khi nhiều nhân viên cùng bấm nhận một sự cố tại cùng một thời điểm bằng thao tác nguyên tử MongoDB: `findOneAndUpdate({ _id, status: 'PENDING' }, { status: 'IN_PROGRESS', responder: userId })`. Nếu ca đã được nhận trước đó, hệ thống trả về mã `409 Conflict`.
2. **Định tuyến thông báo theo Room (Targeted Socket Routing):**
   - Phân chia kênh phát sóng qua Socket.io: Sự cố kỹ thuật gửi vào `department_TECHNICAL`, sự cố y tế gửi vào `department_MEDICAL`, sự kiện hệ thống gửi vào `room_admin`, và thông báo trạng thái riêng gửi về `user_${reporterId}`.
3. **Thống kê số liệu bằng MongoDB Aggregation Pipeline:**
   - Thay vì nạp toàn bộ danh sách bản ghi về tầng ứng dụng Node.js để tính toán bằng JavaScript, hệ thống tận dụng engine của MongoDB để lọc (`$match`), gom nhóm (`$group`), tính tổng (`$sum`), sắp xếp (`$sort`), giới hạn top (`$limit`) và định hình lại cấu trúc trường hiển thị (`$project`), thực thi song song qua `Promise.all`.
4. **Phân trang và lọc động (Pagination & Dynamic Filtering):**
   - Áp dụng phân trang theo offset `.skip(skip).limit(limitNumber)` kết hợp `countDocuments` để đếm tổng số bản ghi và tính toán `totalPages`, giúp giảm tải dung lượng phản hồi cho Client.

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

```
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
- **Kiểm tra quyền hoàn thành (Ownership Check):** Chỉ đúng kỹ thuật viên được ghi nhận trong trường `responder` mới có quyền chuyển trạng thái sang `RESOLVED` (HTTP `403 Forbidden` nếu người khác thao tác).

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
│   └── db.js                  # Kết nối MongoDB qua Mongoose
├── controllers/
│   ├── userController.js      # Đăng ký, Đăng nhập, Xem thông tin cá nhân
│   ├── incidentController.js  # Nghiệp vụ sự cố (Tạo, Nhận nguyên tử, Hoàn thành)
│   └── adminController.js     # Lọc động & Phân trang, Thống kê Aggregation
├── middlewares/
│   ├── authMiddleware.js      # Xác thực Bearer Token + Phân quyền authorizeRoles
│   └── errorHandler.js        # Middleware bắt và định dạng lỗi tập trung
├── models/
│   ├── userModel.js           # User Schema (Mã hóa bcrypt, phân quyền role & department)
│   └── incidentModel.js       # Incident Schema (Mapping phòng ban, trạng thái Enum)
├── postman/
│   └── SchoolIncidentDispatch.postman_collection.json # File Postman Collection v2.1 (11 endpoints)
├── routes/
│   ├── userRoutes.js          # Router /api/users
│   ├── incidentRoutes.js      # Router /api/incidents
│   └── adminRoutes.js         # Router /api (incidents, analytics)
├── sockets/
│   └── incidentSocket.js      # Xác thực Token khi handshake và phân chia Room
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
| `POST` | `/api/incidents` | Báo cáo sự cố mới (+ Socket.io broadcast) | `student`, `teacher` |
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

## 8. HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ

### 1. Yêu cầu môi trường (Prerequisites)
- **Node.js:** Phiên bản `v20.x` trở lên.
- **MongoDB:** MongoDB Community Server cài đặt cục bộ (cổng mặc định `27017`) hoặc chuỗi kết nối từ MongoDB Atlas.

### 2. Cài đặt mã nguồn
```bash
# 1. Clone repository về máy
git clone <URL_REPO_GITHUB_CUA_BAN>
cd SchoolIncidentDispatch

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường
cp .env.example .env
```

### 3. Cấu hình biến môi trường
Mở file `.env` và kiểm tra các giá trị cấu hình tương ứng với môi trường của bạn:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/school_dispatch
SECRET_KEY=your_jwt_secret_key_here
```

### 4. Khởi tạo dữ liệu mẫu (Seeding)
Chạy script seed để tạo sẵn 4 tài khoản đại diện cho 4 vai trò kèm dữ liệu sự cố mẫu:
```bash
npm run seed
```
*Tài khoản mẫu được tạo tự động:*
- **Admin:** `admin` / mật khẩu: `admin123`
- **Kỹ thuật viên:** `tech_tuan` / mật khẩu: `password123` (Khoa: `TECHNICAL`)
- **Nhân viên Y tế:** `med_hoa` / mật khẩu: `password123` (Khoa: `MEDICAL`)
- **Sinh viên:** `student_nam` / mật khẩu: `password123`

### 5. Khởi chạy Server
```bash
# Chạy ở chế độ phát triển (Tự động tải lại khi đổi code)
npm run dev

# Chạy ở chế độ thông thường
npm start
```

### 6. Kiểm thử qua Postman Collection
Dự án đính kèm sẵn file cấu hình Postman hoàn chỉnh tại:
`postman/SchoolIncidentDispatch.postman_collection.json`

1. Mở Postman → Chọn **Import** → Chọn file `.json` trên.
2. Bộ sưu tập sẽ tự động tạo sẵn 11 Request với đầy đủ URL, Header và Body JSON mẫu.
3. Chạy request `Login` tương ứng với tài khoản cần kiểm thử, sao chép mã Token trả về vào biến collection `token` để bắt đầu gửi các yêu cầu có xác thực.

---

## 9. LỘ TRÌNH MỞ RỘNG TƯƠNG LAI (FUTURE ROADMAP)

- [ ] **In-app Real-time Chat:** Mở rộng Socket.io Room `incident_${id}` để người báo cáo và nhân viên phụ trách có thể trao đổi trực tiếp khi đang xử lý sự cố.
- [ ] **Đính kèm hình ảnh (Media Upload):** Tích hợp Cloudinary hoặc AWS S3 để người báo có thể gửi ảnh chụp hiện trường hư hại.
- [ ] **Mở rộng phòng ban:** Bổ sung thêm khoa `SECURITY` (Bảo vệ / An ninh trật tự).
- [ ] **Xuất báo cáo:** Hỗ trợ Admin xuất dữ liệu sự cố và thống kê định dạng Excel / CSV.
