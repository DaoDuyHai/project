# HỆ THỐNG BÁO CÁO & ĐIỀU PHỐI SỰ CỐ TRƯỜNG HỌC

## (SCHOOL INCIDENT DISPATCH SYSTEM)

> **Backend REST API & Real-time Socket.io — Node.js / Express / MongoDB**

---

## 1. MÔ HÌNH KIẾN TRÚC TỔNG QUAN

```
                            ┌──────────────────────────────────────────────┐
                            │          NODE.JS & EXPRESS BACKEND           │
                            │  - RESTful APIs (Auth, Incidents, Analytics) │
                            │  - Socket.io (Real-time Push & Chat)         │
                            │  - RBAC Middleware (401 / 403)               │
                            │  - MongoDB + Mongoose ODM                    │
                            └──────────────────────┬───────────────────────┘
                                                   │
              ┌────────────────────────────────────┼────────────────────────────────────┐
              ▼                                    ▼                                    ▼
  ┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
  │    TRANG REPORTER      │         │    TRANG DISPATCHER    │         │     TRANG ADMIN        │
  │  (Giáo viên / Học sinh)│         │ (Kỹ thuật / Y tế)     │         │  (Quản trị viên)       │
  │                        │         │                        │         │                        │
  │ [Tab 1] Tạo & Gửi     │ Socket  │ [Tab 1] Sự cố chờ     │ Socket  │ Thống kê theo tháng/năm│
  │         sự cố mới      │◄───────►│         tiếp nhận      │◄───────►│ Theo dõi toàn bộ       │
  │ [Tab 2] Lịch sử sự cố │  Push   │ [Tab 2] Sự cố đang    │  Push   │ trạng thái sự cố       │
  │         đã gửi         │         │         làm / đã xong  │         │ trong hệ thống         │
  └────────────────────────┘         └────────────────────────┘         └────────────────────────┘
```

### Công nghệ sử dụng

| Thành phần | Công nghệ                                                 |
| :--------- | :-------------------------------------------------------- |
| Runtime    | Node.js (ES Modules)                                      |
| Framework  | Express.js v5.x                                           |
| Database   | MongoDB + Mongoose ODM                                    |
| Xác thực   | JWT (JSON Web Token) + Bcrypt                             |
| Phân quyền | RBAC Middleware (Role + Department + Ownership)           |
| Real-time  | Socket.io (Room-based Push & Notification)                |
| Kiến trúc  | Layered MVC (Routes → Controllers → Models → Middlewares) |

---

## 2. PHÂN HỆ NGƯỜI DÙNG & VAI TRÒ

| Vai trò (Role)        | Phòng ban (Department) | Mô tả                          | Quyền hạn chính                                    |
| :-------------------- | :--------------------- | :----------------------------- | :------------------------------------------------- |
| `student` / `teacher` | `GENERAL`              | Giáo viên, Học sinh (Reporter) | Tạo sự cố, Xem sự cố **của mình**                  |
| `dispatcher`          | `TECHNICAL`            | Kỹ thuật viên cơ sở vật chất   | Xem & Nhận sự cố **Kỹ thuật**, Cập nhật trạng thái |
| `dispatcher`          | `MEDICAL`              | Nhân viên y tế học đường       | Xem & Nhận sự cố **Y tế**, Cập nhật trạng thái     |
| `admin`               | —                      | Ban Giám Hiệu / Quản trị viên  | Xem toàn bộ, Thống kê, Xuất báo cáo                |

---

## 3. MÔ TẢ NGHIỆP VỤ TỪNG TRANG

### 3.1. TRANG REPORTER (Giáo viên / Học sinh)

#### Tab 1 — Tạo & Gửi sự cố mới

- Reporter điền form:
  - **Tiêu đề sự cố** (`title`): Ví dụ _"Quạt trần rơi cánh"_
  - **Vị trí** (`location`): Ví dụ `A201`, `Lab Hóa`, `Sân bóng`
  - **Loại sự cố** (`type`): Chọn 1 trong danh sách:
    - `Hỏng điện / Nước / Thiết bị` → Server tự phân vào department **`TECHNICAL`**
    - `Tai nạn / Sức khỏe / Cấp cứu` → Server tự phân vào department **`MEDICAL`**
  - **Mô tả chi tiết** (`description`)
  - _(Đính kèm ảnh: Coming soon — sẽ bổ sung ở giai đoạn cải tiến)_
- Bấm **"Gửi báo cáo"** → Server lưu vào MongoDB + **Socket.io đẩy real-time** về đúng phòng ban.

#### Tab 2 — Lịch sử sự cố đã gửi

- Hiển thị **tất cả** sự cố mà tài khoản Reporter này đã gửi (không phân loại theo department — vì đây chỉ là sự cố của chính mình).
- Mỗi dòng hiển thị: Tiêu đề | Vị trí | Loại sự cố | **Trạng thái hiện tại** (`PENDING` / `IN_PROGRESS` / `RESOLVED`) | Thời gian tạo.
- **Real-time:** Khi Dispatcher nhận việc hoặc hoàn thành → Trạng thái sự cố tự động cập nhật trên màn hình Reporter mà **không cần reload trang**.

---

### 3.2. TRANG DISPATCHER (Kỹ thuật viên / Nhân viên Y tế)

> Hiện tại hệ thống hỗ trợ 2 loại Dispatcher: **TECHNICAL** (Kỹ thuật) và **MEDICAL** (Y tế).
> _(Bổ sung thêm SECURITY ở giai đoạn cải tiến)_

#### Tab 1 — Sự cố chờ tiếp nhận

- Hiển thị **chỉ** các sự cố có `status = "PENDING"` **và** thuộc đúng phòng ban (`department`) của Dispatcher đang đăng nhập.
  - Ví dụ: Kỹ thuật viên chỉ thấy sự cố `TECHNICAL`, không thấy sự cố `MEDICAL`.
- Mỗi dòng có nút **"Nhận sự cố"**:
  - Bấm nhận → Trạng thái chuyển thành `IN_PROGRESS`, ghi nhận `responderId`.
  - **Real-time:** Sự cố vừa được nhận sẽ **biến mất** khỏi Tab 1 của các Dispatcher khác cùng phòng ban (không cần reload). Đồng thời, bên trang Reporter, trạng thái cũng tự cập nhật.
- **Real-time:** Khi Reporter gửi sự cố mới → Sự cố **tự động xuất hiện** trên Tab 1 của Dispatcher đúng phòng ban ngay lập tức (không cần reload).

#### Tab 2 — Sự cố đang xử lý / Đã hoàn thành

- Hiển thị các sự cố mà **chính Dispatcher này** đã bấm nhận (cả `IN_PROGRESS` lẫn `RESOLVED`).
- Sự cố đang ở trạng thái `IN_PROGRESS` có nút **"Hoàn thành"**:
  - Bấm hoàn thành → Nhập ghi chú cách xử lý (`resolutionNotes`) → Trạng thái chuyển thành `RESOLVED`.
  - **Real-time:** Bên trang Reporter, trạng thái sự cố cũng tự cập nhật thành `RESOLVED`.
- Sự cố `RESOLVED` hiển thị ở cuối danh sách với ghi chú giải quyết.

---

### 3.3. TRANG ADMIN (Quản trị viên / Ban Giám Hiệu)

- **Theo dõi toàn bộ sự cố trong hệ thống:**
  - Danh sách tất cả sự cố (mọi phòng ban, mọi trạng thái).
  - Lọc theo: Trạng thái (`PENDING` / `IN_PROGRESS` / `RESOLVED`), Phòng ban (`TECHNICAL` / `MEDICAL`), Khoảng thời gian.
  - **Real-time:** Khi có sự cố mới được tạo hoặc trạng thái thay đổi → Dashboard Admin tự cập nhật.
- **Thống kê:**
  - Số lượng sự cố theo tháng, theo năm.
  - Tỷ lệ phân bổ theo phòng ban.
  - Top phòng học/khu vực hay xảy ra sự cố nhất ("Điểm nóng").
  - _(Xuất file CSV: Coming soon — giai đoạn cải tiến)_

---

## 4. LUỒNG REAL-TIME: CHỖ NÀO CẦN SOCKET.IO, CHỖ NÀO REQUEST/RESPONSE BÌNH THƯỜNG

### Bắt buộc Real-time (Socket.io):

| Sự kiện                     | Ai phát (emit) | Ai nhận (receive)                                             | Mô tả                                                                                 |
| :-------------------------- | :------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------------------ |
| Reporter tạo sự cố mới      | Server         | Dispatcher đúng phòng ban + Admin                             | Sự cố mới xuất hiện trên Tab 1 Dispatcher & Dashboard Admin ngay lập tức              |
| Dispatcher bấm "Nhận sự cố" | Server         | Reporter (người tạo) + Admin + Các Dispatcher khác cùng phòng | Trạng thái đổi thành `IN_PROGRESS`. Sự cố biến mất khỏi Tab "chờ" của Dispatcher khác |
| Dispatcher bấm "Hoàn thành" | Server         | Reporter (người tạo) + Admin                                  | Trạng thái đổi thành `RESOLVED`                                                       |

### Giữ nguyên Request/Response (REST API bình thường):

| Thao tác                                  | Lý do                                          |
| :---------------------------------------- | :--------------------------------------------- |
| Đăng ký / Đăng nhập                       | Chỉ xảy ra 1 lần, không cần real-time          |
| Xem Profile                               | Dữ liệu tĩnh, không thay đổi liên tục          |
| Lấy lịch sử sự cố đã gửi (lần đầu mở tab) | Tải dữ liệu ban đầu khi vào trang              |
| Xem danh sách sự cố chờ (lần đầu mở tab)  | Tải dữ liệu ban đầu khi vào trang              |
| Admin xem Thống kê                        | Dữ liệu tổng hợp, không cần cập nhật từng giây |

---

## 5. VÒNG ĐỜI TRẠNG THÁI SỰ CỐ (INCIDENT LIFECYCLE)

```
   Reporter tạo sự cố
          │
          ▼
   ┌──────────────┐     Dispatcher bấm      ┌──────────────┐     Dispatcher bấm     ┌──────────────┐
   │   PENDING     │ ──── "Nhận sự cố" ────► │ IN_PROGRESS  │ ──── "Hoàn thành" ───► │   RESOLVED   │
   │  (Chờ tiếp    │                         │ (Đang xử lý) │                        │ (Đã hoàn     │
   │   nhận)       │                         │               │                        │  thành)      │
   └──────────────┘                          └──────────────┘                         └──────────────┘
         │                                          │                                        │
         │ Socket.io → Dispatcher + Admin           │ Socket.io → Reporter + Admin            │ Socket.io → Reporter + Admin
         │ (Sự cố mới xuất hiện)                    │ (Trạng thái cập nhật)                   │ (Trạng thái cập nhật)
```

---

## 6. CHỐNG "TÁY MÁY" — PHÂN QUYỀN ĐA TẦNG (RBAC)

```
Request đến Server
   │
   ▼
[ Tầng 1: authMiddleware ]    ─── Không có / Sai Token ───► 401 Unauthorized
   │
   ▼
[ Tầng 2: authorizeRoles ]    ─── Sai Role (Reporter nhận việc) ───► 403 Forbidden
   │
   ▼
[ Tầng 3: Kiểm tra Department ] ─── Sai phòng ban (KT nhận ca YT) ───► 403 Forbidden
   │
   ▼
[ Tầng 4: Kiểm tra Ownership ]  ─── Không phải người nhận ca này ───► 403 Forbidden
   │
   ▼
[ THÀNH CÔNG ]
```

| Kịch bản                                          | Kết quả                                      |
| :------------------------------------------------ | :------------------------------------------- |
| Học sinh bấm vào link "Nhận sự cố" của Dispatcher | `403 Forbidden` — Role không đủ quyền        |
| Kỹ thuật viên bấm nhận ca Y tế                    | `403 Forbidden` — Sai phòng ban chuyên môn   |
| Nhân viên A bấm "Hoàn thành" ca của Nhân viên B   | `403 Forbidden` — Không phải người phụ trách |
| Người dùng bất kỳ vào link Thống kê của Admin     | `403 Forbidden` — Chỉ Admin được xem         |

---

## 7. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
SchoolIncidentDispatch/
├── config/
│   └── db.js                  # Cấu hình kết nối MongoDB
├── controllers/
│   ├── userController.js      # Đăng ký, Đăng nhập
│   └── incidentController.js  # Tạo, Nhận, Hoàn thành sự cố
├── middlewares/
│   ├── authMiddleware.js      # Xác thực JWT + Phân quyền RBAC (authorizeRoles)
│   └── errorHandler.js        # Bắt lỗi tập trung
├── models/
│   ├── userModel.js           # User (userName, password, role, department)
│   └── incidentModel.js       # Incident (title, location, type, department, status, reporter, responder)
├── routes/
│   ├── userRoutes.js          # API /api/users
│   └── incidentRoutes.js      # API /api/incidents
├── sockets/
│   └── incidentSocket.js      # Socket.io: Join room theo department, emit sự kiện real-time
├── utils/
│   └── createHttpError.js     # Helper chuẩn hóa lỗi HTTP
├── .env
├── .gitignore
├── package.json
└── server.js                  # Express + HTTP Server + Socket.io
```

---

## 8. DANH SÁCH API ENDPOINTS

### Authentication

| Method | Endpoint              | Mô tả                     | Quyền        |
| :----: | :-------------------- | :------------------------ | :----------- |
|  POST  | `/api/users/register` | Đăng ký tài khoản         | Public       |
|  POST  | `/api/users/login`    | Đăng nhập, nhận JWT Token | Public       |
|  GET   | `/api/users/profile`  | Xem thông tin cá nhân     | Đã đăng nhập |

### Incidents

| Method | Endpoint                     | Mô tả                                | Quyền                   |
| :----: | :--------------------------- | :----------------------------------- | :---------------------- |
|  POST  | `/api/incidents`             | Tạo sự cố mới + Socket.io push       | Reporter                |
|  GET   | `/api/incidents/my-reports`  | Lịch sử sự cố đã gửi (của mình)      | Reporter                |
|  GET   | `/api/incidents/pending`     | Sự cố chờ tiếp nhận (đúng phòng ban) | Dispatcher              |
|  GET   | `/api/incidents/my-tasks`    | Sự cố mình đang/đã xử lý             | Dispatcher              |
| PATCH  | `/api/incidents/:id/accept`  | Nhận sự cố + Socket.io push          | Dispatcher              |
| PATCH  | `/api/incidents/:id/resolve` | Hoàn thành sự cố + Socket.io push    | Dispatcher (người nhận) |
|  GET   | `/api/incidents`             | Xem toàn bộ sự cố hệ thống           | Admin                   |
|  GET   | `/api/incidents/analytics`   | Thống kê theo tháng/năm/phòng ban    | Admin                   |

---

## 9. CÁC TÍNH NĂNG SẼ CẢI TIẾN SAU (COMING SOON)

- [ ] Đính kèm ảnh hiện trường khi tạo sự cố (Multer upload)
- [ ] Bổ sung phòng ban thứ 3: `SECURITY` (Bảo vệ / An ninh)
- [ ] Kênh Chat 1-1 giữa Reporter và Dispatcher qua Socket.io Room
- [ ] Xuất file CSV báo cáo thống kê cho Admin
- [ ] Ghi chú chi tiết cách xử lý khi Dispatcher hoàn thành sự cố
- [ ] Thông báo đẩy cho Dispatcher đang offline (lưu hàng đợi, đẩy khi online)
