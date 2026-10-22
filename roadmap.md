# 🚀 HÀNH TRÌNH CHINH PHỤC INTERN BACKEND NODE.JS TRONG 10 NGÀY

## Dự án: School Incident Dispatch System (Điều phối sự cố trường học)

> **Phương châm cốt lõi:**
>
> 1. _"Làm đến đâu – Hoàn thiện sản phẩm đến đó"_ (Mỗi giai đoạn kết thúc = 1 bản chạy được 100% trên Postman).
> 2. **Làm toàn bộ REST API (req/res) trước $\rightarrow$ Test mượt mà $\rightarrow$ Mới gắn Socket.io Real-time sau cùng.**
> 3. Mọi chi tiết về Input/Output của API, xem đối chiếu tại file: [`TAI_LIEU_API_VA_YEU_CAU_FRONTEND.md`](file:///d:/SchoolIncidentDispatch/TAI_LIEU_API_VA_YEU_CAU_FRONTEND.md).

---

## 🗺️ TỔNG QUAN LỘ TRÌNH 5 GIAI ĐOẠN

```
[GĐ 0: ĐÃ XONG ✅] ──► [GĐ 1: Ngày 1-2] ──► [GĐ 2: Ngày 3-4] ──► [GĐ 3: Ngày 5-7] ──► [GĐ 4: Ngày 8-9] ──► [GĐ 5: Ngày 10]
   Nền tảng Auth         CRUD Sự cố cơ bản     Vòng đời & Phân quyền   Gắn Real-time          Thống kê Admin         Đóng gói CV &
   (User, JWT, DB)       (REST API v1.0)       (Chống táy máy v1.2)   (Socket.io v2.0)       (Aggregation v2.2)     Luyện phỏng vấn
```

---

## 📌 GIAI ĐOẠN 0: NỀN TẢNG XÁC THỰC (AUTHENTICATION) — [ĐÃ XONG ✅]

> **Trạng thái:** Hoàn thành kiến trúc MVC, kết nối MongoDB, mã hóa mật khẩu và cấp Token.

- **Công việc đã làm:**
  - Xây dựng cấu trúc thư mục: `config/`, `controllers/`, `middlewares/`, `models/`, `routes/`, `utils/`.
  - Kết nối MongoDB an toàn qua `config/db.js`.
  - Viết Model `User`: lưu `userName`, `password` (băm bcrypt, ẩn khỏi query), `fullName`, `role`, `department`.
  - Viết middleware bắt lỗi tập trung `errorHandler.js` và helper `createHttpError.js`.
  - Viết middleware xác thực danh tính `authMiddleware.js`.
- **API hoàn thành trong GĐ 0 (Đối chiếu tài liệu API - Mục 2):**
  - `POST /api/users/register` — Đăng ký tài khoản.
  - `POST /api/users/login` — Đăng nhập, trả về Token + User info cho FE.
  - `GET /api/users/profile` — Lấy thông tin cá nhân của token đang đăng nhập.
- **Sản phẩm nghiệm thu:** Đã test trên Postman đăng ký và đăng nhập thành công.

---

## 🟢 GIAI ĐOẠN 1 (NGÀY 1 - NGÀY 2): CRUD SỰ CỐ CỐT LÕI (CORE REST API)

> **Mục tiêu:** Xây dựng tính năng tiếp nhận sự cố cơ bản. Viết hoàn toàn bằng HTTP Request/Response truyền thống, **chưa cần đụng đến Socket.io**.
> **Sản phẩm đạt được:** Phiên bản **v1.0 (Basic Incident Manager)**.

### Ngày 1: Tạo Model Sự cố & API Gửi báo cáo

- **Việc cần làm:**
  1. Tạo `models/incidentModel.js`:
     - `title`: Tiêu đề sự cố (String, required)
     - `location`: Vị trí phòng học (String, required)
     - `type`: Loại sự cố Reporter chọn (`"Hỏng điện / Nước / Thiết bị"` hoặc `"Tai nạn / Sức khỏe / Cấp cứu"`)
     - `department`: Server **tự động mapping** (`TECHNICAL` hoặc `MEDICAL`)
     - `description`: Mô tả chi tiết (String)
     - `status`: Trạng thái (`PENDING`, `IN_PROGRESS`, `RESOLVED` - mặc định `PENDING`)
     - `reporter`: Tham chiếu ObjectId tới `User` (người tạo)
     - `responder`: Tham chiếu ObjectId tới `User` (người nhận việc, ban đầu là `null`)
     - `resolutionNotes`: Ghi chú cách giải quyết (String, default: `null`)
     - `timestamps: true` (tự tạo `createdAt`, `updatedAt`)
  2. Viết Controller `createIncident`:
     - Nhận `title`, `location`, `type`, `description` từ `req.body`.
     - Tự động gán `department`:
       - Nếu `type` là thiết bị / điện / nước $\rightarrow$ `department = "TECHNICAL"`.
       - Nếu `type` là tai nạn / sức khỏe / cấp cứu $\rightarrow$ `department = "MEDICAL"`.
     - Gán `reporter = req.user.userId`.
  3. Tạo Route `POST /api/incidents` gắn `authMiddleware`.
- **Nghiệm thu Ngày 1:**
  - [x] Gọi `POST /api/incidents` gửi sự cố loại điện $\rightarrow$ MongoDB lưu với `department: "TECHNICAL"`.
  - [x] Gửi sự cố loại y tế $\rightarrow$ MongoDB lưu với `department: "MEDICAL"`.

### Ngày 2: Các API Xem danh sách cho từng màn hình

- **Việc cần làm:**
  1. Viết API cho **Reporter Tab 2** (`GET /api/incidents/my-reports`):
     - Query: `Incident.find({ reporter: req.user.userId }).sort({ createdAt: -1 })`.
     - Chỉ trả về danh sách sự cố của chính người đang đăng nhập.
  2. Viết API cho **Dispatcher Tab 1** (`GET /api/incidents/pending`):
     - Query: `Incident.find({ status: "PENDING", department: req.user.department })`.
     - Kỹ thuật viên chỉ thấy ca Kỹ thuật; Y tế chỉ thấy ca Y tế đang chờ.
  3. Viết API cho **Dispatcher Tab 2** (`GET /api/incidents/my-tasks`):
     - Query: `Incident.find({ responder: req.user.userId })`.
     - Lấy các ca mà chính người này đang làm hoặc đã làm xong.
- **Nghiệm thu Ngày 2:**
  - [x] Đăng nhập Reporter $\rightarrow$ Gọi `GET /my-reports` $\rightarrow$ Thấy đúng danh sách sự cố của mình.
  - [x] Đăng nhập Dispatcher Kỹ thuật $\rightarrow$ Gọi `GET /pending` $\rightarrow$ Chỉ thấy ca Kỹ thuật PENDING.
  - [x] Đăng nhập Dispatcher Y tế $\rightarrow$ Gọi `GET /pending` $\rightarrow$ Chỉ thấy ca Y tế PENDING.

\*🎯 **Đối chiếu API Contract: Xem Mục 3.1, Mục 3.2, Mục 4.1, Mục 4.2 trong tài liệu API.\***

---

## 🟡 GIAI ĐOẠN 2 (NGÀY 3 - NGÀY 4): VÒNG ĐỜI TIẾP NHẬN & CHỐNG "TÁY MÁY" (WORKFLOW & RBAC)

> **Mục tiêu:** Xử lý luồng Nhận việc $\rightarrow$ Hoàn thành việc. Chặn đứng 100% các hành vi gọi sai quyền (trả mã `403 Forbidden`). Vẫn viết bằng HTTP req/res thông thường.
> **Sản phẩm đạt được:** Phiên bản **v1.2 (Workflow & Security)**.

### Ngày 3: API Nhận việc (`accept`) & Chống vượt quyền

- **Việc cần làm:**
  1. Viết middleware `authorizeRoles(...roles)` trong `authMiddleware.js`.
  2. Viết Controller `acceptIncident` (`PATCH /api/incidents/:id/accept`):
     - **Cửa chặn 1 (Role):** Gắn `authorizeRoles("dispatcher", "admin")` $\rightarrow$ Học sinh táy máy bấm nhận việc bị chặn `403`.
     - **Cửa chặn 2 (Department):** Kiểm tra `incident.department === req.user.department` $\rightarrow$ Kỹ thuật viên táy máy nhận ca Y tế bị chặn `403`.
     - **Cửa chặn 3 (Status):** Kiểm tra `incident.status === "PENDING"` $\rightarrow$ Ca đã có người nhận rồi thì chặn `400`.
     - Nếu hợp lệ: Cập nhật `status = "IN_PROGRESS"`, `responder = req.user.userId`.
- **Nghiệm thu Ngày 3:**
  - [x] Logic kiểm tra phòng ban (`incident.department !== req.user.department`) $\rightarrow$ Bị chặn `403 Forbidden` ✅.
  - [x] Logic kiểm tra trạng thái nguyên tử (`status: "PENDING"`) $\rightarrow$ Tránh nhận đè, trùng lặp ✅.
  - [x] Nhận đúng ca thuộc phòng ban của mình $\rightarrow$ Thành công chuyển `IN_PROGRESS` ✅.

### Ngày 4: API Hoàn thành (`resolve`) & Route Admin

- **Việc cần làm:**
  1. Viết Controller `resolveIncident` (`PATCH /api/incidents/:id/resolve`):
     - **Cửa chặn quyền sở hữu:** Kiểm tra `incident.responder.toString() === req.user.userId` (trừ Admin). Nhân viên A táy máy bấm hoàn thành ca của Nhân viên B bị chặn `403`.
     - Kiểm tra trạng thái: Sự cố phải đang `IN_PROGRESS`.
     - Cập nhật `status = "RESOLVED"`, lưu `resolutionNotes` (ghi chú cách xử lý).
  2. Viết API cho **Admin** (`GET /api/incidents`):
     - Gắn `authorizeRoles("admin")` $\rightarrow$ User thường táy máy xem toàn bộ trường bị chặn `403`.
     - Hỗ trợ query lọc: `?status=...&department=...`.
- **Nghiệm thu Ngày 4:**
  - [x] Nhân viên A bấm hoàn thành ca của Nhân viên B $\rightarrow$ Bị chặn `403 Forbidden` ✅.
  - [x] Đúng người phụ trách bấm hoàn thành $\rightarrow$ Thành công chuyển `RESOLVED`, lưu `resolvedAt` và `resolutionNotes` ✅.
  - [ ] Tài khoản không phải Admin vào `GET /api/incidents` $\rightarrow$ Bị chặn `403 Forbidden` (Viết nốt API Admin vào ngày mai).

\*🎯 **Đối chiếu API Contract: Xem Mục 4.1 (Action Nhận việc), Mục 4.2 (Action Hoàn thành), Mục 5.1 trong tài liệu API.\***

---

## 🔴 GIAI ĐOẠN 3 (NGÀY 5 - NGÀY 7): GẮN REAL-TIME VỚI SOCKET.IO

> **Mục tiêu:** Bây giờ toàn bộ hệ thống REST API đã chạy mượt mà, ta bắt đầu gắn **Socket.io** để biến nó thành hệ thống Thời gian thực.
> **Sản phẩm đạt được:** Phiên bản **v2.0 (Realtime Dispatch System)**.

### Ngày 5: Cài đặt Socket.io Server & Push Sự cố mới

- **Việc cần làm:**
  1. Cài đặt: `npm install socket.io`.
  2. Cấu hình Socket trong `server.js`: Tạo `httpServer` bọc Express `app`, khởi tạo `io = new Server(httpServer)`.
  3. Xây dựng logic kết nối:
     - Khi Client kết nối $\rightarrow$ Đọc Token để biết user đó thuộc phòng ban nào:
       - Dispatcher Kỹ thuật $\rightarrow$ `socket.join("dept_TECHNICAL")`.
       - Dispatcher Y tế $\rightarrow$ `socket.join("dept_MEDICAL")`.
       - Reporter $\rightarrow$ `socket.join("user_" + userId)`.
       - Admin $\rightarrow$ `socket.join("admin_room")`.
  4. **Gắn thêm ĐÚNG 1 DÒNG vào hàm `createIncident` (đã viết ở GĐ 1):**
     ```javascript
     req.io
       .to(`dept_${newIncident.department}`)
       .emit("new_incident", newIncident);
     req.io.to("admin_room").emit("new_incident", newIncident);
     ```
- **Nghiệm thu Ngày 5:**
  - [ ] Mở 2 tab trình duyệt/Postman Socket: 1 tab Dispatcher Kỹ thuật, 1 tab Reporter gửi sự cố điện.
  - [ ] Vừa bấm gửi bên Reporter $\rightarrow$ Tab Dispatcher nhận được sự kiện `new_incident` ngay lập tức mà không cần reload!

### Ngày 6: Real-time Cập nhật trạng thái (Accept & Resolve)

- **Việc cần làm:**
  1. **Gắn thêm vào hàm `acceptIncident` (đã viết ở GĐ 2):**
     - Phát tới Reporter: Báo tin sự cố của bạn đã có người nhận (`incident_updated`).
     - Phát tới Dispatcher cùng phòng: Báo tin sự cố này đã có người nhận, hãy xóa khỏi Tab 1 (`incident_accepted`).
  2. **Gắn thêm vào hàm `resolveIncident` (đã viết ở GĐ 2):**
     - Phát tới Reporter: Báo tin sự cố đã được sửa xong (`incident_updated`).
     - Phát tới Admin: Cập nhật Dashboard (`incident_updated`).
- **Nghiệm thu Ngày 6:**
  - [ ] Dispatcher bấm nhận ca $\rightarrow$ Màn hình Reporter tự đổi màu Badge sang `IN_PROGRESS`!
  - [ ] Dispatcher bấm hoàn thành $\rightarrow$ Màn hình Reporter tự đổi màu Badge sang `RESOLVED`!

### Ngày 7: Kiểm thử tổng hợp Real-time & Sửa lỗi

- **Việc cần làm:**
  - Test kịch bản 3 bên hoạt động đồng thời (Reporter + Dispatcher + Admin).
  - Kiểm tra ngắt kết nối (Disconnect) và kết nối lại.

\*🎯 **Đối chiếu API Contract: Xem Mục 6 (Bảng tổng hợp Socket.io) trong tài liệu API.\***

---

## 🟣 GIAI ĐOẠN 4 (NGÀY 8 - NGÀY 9): THỐNG KÊ ANALYTICS CHO ADMIN

> **Mục tiêu:** Viết API Thống kê số liệu bằng **MongoDB Aggregation Pipeline**. Chỉ Admin mới có quyền truy cập.
> **Sản phẩm đạt được:** Phiên bản **v2.2 (Admin Analytics)**.

### Ngày 8: API Thống kê bằng Aggregation Pipeline

- **Việc cần làm:**
  1. Viết hàm `getAnalytics` (`GET /api/incidents/analytics`):
     - Gắn `authMiddleware` + `authorizeRoles("admin")`.
     - Dùng Aggregation Pipeline tính toán:
       - Tổng số ca theo từng trạng thái (`PENDING`, `IN_PROGRESS`, `RESOLVED`).
       - Tổng số ca theo từng phòng ban (`TECHNICAL`, `MEDICAL`).
       - **Top 3 điểm nóng:** Gom nhóm theo `location`, đếm số lượng, sắp xếp giảm dần, lấy top 3 phòng học hay hỏng hóc nhất.
- **Nghiệm thu Ngày 8:**
  - [ ] Tạo khoảng 10 sự cố mẫu với các phòng và trạng thái khác nhau.
  - [ ] Đăng nhập Admin gọi `GET /api/incidents/analytics` $\rightarrow$ Trả về đúng cấu trúc JSON để FE vẽ biểu đồ.
  - [ ] Đăng nhập Học sinh gọi API này $\rightarrow$ Nhận `403 Forbidden`.

### Ngày 9: Hoàn thiện Dashboard Admin & Tối ưu hóa

- **Việc cần làm:**
  - Hoàn thiện phân trang (Pagination: `?page=1&limit=10`) cho API lấy danh sách toàn trường.
  - Rà soát mã lỗi, format response thống nhất toàn dự án.

\*🎯 **Đối chiếu API Contract: Xem Mục 5.2 trong tài liệu API.\***

---

## 🏁 GIAI ĐOẠN 5 (NGÀY 10): ĐÓNG GÓI CV & LUYỆN PHỎNG VẤN

### Nhiệm vụ cụ thể:

1. **Dọn dẹp code & Repository:**
   - Thêm comment giải thích ở những đoạn logic nghiệp vụ quan trọng.
   - Đẩy toàn bộ source code lên GitHub cá nhân (kèm file `README.md` đã có sẵn).
2. **Export Postman Collection:**
   - Lưu toàn bộ các request đã test vào 1 Collection trên Postman, export ra file `.json` để vào thư mục dự án.
3. **Mẫu viết dự án vào CV:**

   ```
   DỰ ÁN: SCHOOL INCIDENT DISPATCH SYSTEM (Hệ thống điều phối sự cố học đường)
   Vị trí: Backend Developer | Công nghệ: Node.js, Express, MongoDB, Socket.io, JWT

   - Thiết kế và phát triển RESTful API theo kiến trúc phân tầng MVC phục vụ 3 nhóm người dùng (Reporter, Dispatcher, Admin).
   - Triển khai cơ chế phân quyền đa tầng (RBAC Middleware) kiểm soát chặt chẽ theo Role, Department và Resource Ownership, ngăn chặn 100% các hành vi truy cập trái phép.
   - Ứng dụng Socket.io Rooms để tự động định tuyến và phân phối thông báo sự cố thời gian thực về đúng phòng ban chuyên trách và cập nhật trạng thái hai chiều không cần tải lại trang.
   - Tối ưu hóa truy vấn dữ liệu báo cáo và phân tích "điểm nóng" hư hại cơ sở vật chất bằng MongoDB Aggregation Pipeline.
   ```

---

## 📋 BẢNG CHECKLIST ĐỐI CHIẾU HÀNG NGÀY

| Giai đoạn |  Ngày  | Nội dung chính                          | API liên quan (Mục trong file API Contract)                            |           Trạng thái           |
| :-------: | :----: | :-------------------------------------- | :--------------------------------------------------------------------- | :----------------------------: |
| **GĐ 0**  | **0**  | Nền tảng Auth, MVC, MongoDB             | `POST /register`, `POST /login`, `GET /profile` (Mục 2)                |            ✅ Xong             |
| **GĐ 1**  | **1**  | Incident Model + API Báo sự cố          | `POST /api/incidents` (Mục 3.1)                                        |       ✅ Đã hoàn thành         |
| **GĐ 1**  | **2**  | API Danh sách cho Reporter & Dispatcher | `GET /my-reports`, `GET /pending`, `GET /my-tasks` (Mục 3.2, 4.1, 4.2) | ✅ Đã hoàn thành (v1.0 REST)   |
| **GĐ 2**  | **3**  | Phân quyền RBAC + API Nhận việc         | `PATCH /api/incidents/:id/accept` (Mục 4.1)                            | ✅ Đã viết xong logic cốt lõi |
| **GĐ 2**  | **4**  | API Hoàn thành + Danh sách Admin        | `PATCH /api/incidents/:id/resolve`, `GET /incidents` (Mục 4.2, 5.1)    | ⏳ Còn nốt API Admin vào ngày mai |
| **GĐ 3**  | **5**  | Setup Socket.io Server + Push sự cố mới | Gắn `new_incident` vào hàm tạo sự cố (Mục 6)                           |  ⏳ Chờ làm  |
| **GĐ 3**  | **6**  | Real-time Cập nhật trạng thái 2 chiều   | Gắn `incident_accepted`, `incident_updated` (Mục 6)                    |  ⏳ Chờ làm  |
| **GĐ 3**  | **7**  | Kiểm thử toàn diện Real-time 3 bên      | Test luồng end-to-end                                                  |  ⏳ Chờ làm  |
| **GĐ 4**  | **8**  | Aggregation Pipeline Thống kê           | `GET /api/incidents/analytics` (Mục 5.2)                               |  ⏳ Chờ làm  |
| **GĐ 4**  | **9**  | Hoàn thiện Admin Dashboard & Phân trang | Rà soát toàn bộ hệ thống                                               |  ⏳ Chờ làm  |
| **GĐ 5**  | **10** | Đẩy GitHub, Viết CV, Luyện phỏng vấn    | ĐÓNG GÓI DỰ ÁN                                                         |  ⏳ Chờ làm  |
