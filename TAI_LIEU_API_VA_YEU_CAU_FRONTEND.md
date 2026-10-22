# 📑 HỢP ĐỒNG API & TÀI LIỆU YÊU CẦU FRONTEND (API CONTRACT)

## Dự án: School Incident Dispatch System

> **Mục đích tài liệu:** Quy định rõ ràng cho từng API: Frontend cần gửi lên những gì? Backend cần trả về cấu trúc JSON ra sao? Frontend dùng dữ liệu đó để làm gì trên màn hình? Và từng API được xây dựng ở **Giai đoạn (GĐ)** nào trong lộ trình 10 ngày.

---

## 🌐 1. QUY CHUẨN CHUNG (GLOBAL CONVENTIONS)

- **Base URL:** `http://localhost:3000/api`
- **Xác thực:** Gửi kèm Token qua HTTP Header cho tất cả các API nội bộ:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Format phản hồi chuẩn (Response Format):**
  - **Thành công (HTTP 200 / 201):**
    ```json
    {
      "message": "Nội dung thông báo cho người dùng",
      "data": { ... } // hoặc trả trực tiếp các object như token, user, incident
    }
    ```
  - **Thất bại (HTTP 400, 401, 403, 404, 500):**
    ```json
    {
      "message": "Mô tả nguyên nhân lỗi để FE hiển thị thông báo đỏ (Toast)"
    }
    ```

---

## 🔑 2. PHÂN HỆ AUTHENTICATION [GIAI ĐOẠN 0 — ĐÃ XONG ✅]

### 2.1. Đăng ký tài khoản (Register)

- **Giai đoạn:** `Giai đoạn 0`
- **Endpoint:** `POST /api/users/register`
- **Quyền hạn:** Public (Ai cũng gọi được)
- **FE gửi lên Body:**
  ```json
  {
    "userName": "gv_lan",
    "password": "password123",
    "fullName": "Cô Trần Thị Lan",
    "role": "teacher", // "student" | "teacher" | "dispatcher" | "admin"
    "department": null // "TECHNICAL" | "MEDICAL" (Bắt buộc nếu role là dispatcher)
  }
  ```
- **BE trả về (201 Created):**
  ```json
  {
    "message": "Đăng ký tài khoản thành công."
  }
  ```
- **Ý nghĩa với FE:** Hiển thị thông báo Toast xanh $\rightarrow$ Tự động chuyển trang về `/login`.

---

### 2.2. Đăng nhập hệ thống (Login)

- **Giai đoạn:** `Giai đoạn 0`
- **Endpoint:** `POST /api/users/login`
- **Quyền hạn:** Public
- **FE gửi lên Body:**
  ```json
  {
    "userName": "gv_lan",
    "password": "password123"
  }
  ```
- **BE trả về (200 OK):**
  ```json
  {
    "message": "Đăng nhập thành công.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6717a1b2c3d4e5f6a7b8c9d0",
      "userName": "gv_lan",
      "fullName": "Cô Trần Thị Lan",
      "role": "teacher",
      "department": null
    }
  }
  ```
- **Ý nghĩa với FE:**
  1. Lưu `token` vào `localStorage`.
  2. Lưu `user` vào State (Redux / Pinia / React Context) để hiển thị tên _"Xin chào, Cô Trần Thị Lan"_.
  3. **Điều hướng trang theo vai trò (`user.role`):**
     - Nếu `role` là `"student"` hoặc `"teacher"` $\rightarrow$ Chuyển sang trang Reporter (`/reporter`).
     - Nếu `role` là `"dispatcher"` $\rightarrow$ Chuyển sang trang Dispatcher (`/dispatcher`).
     - Nếu `role` là `"admin"` $\rightarrow$ Chuyển sang trang Admin (`/admin`).

---

### 2.3. Lấy thông tin cá nhân (Profile)

- **Giai đoạn:** `Giai đoạn 0`
- **Endpoint:** `GET /api/users/profile`
- **Quyền hạn:** Đã đăng nhập (`authMiddleware`)
- **BE trả về (200 OK):**
  ```json
  {
    "message": "Lấy thông tin tài khoản thành công.",
    "user": {
      "userId": "6717a1b2c3d4e5f6a7b8c9d0",
      "userName": "gv_lan",
      "fullName": "Cô Trần Thị Lan",
      "role": "teacher",
      "department": null
    }
  }
  ```
- **Ý nghĩa với FE:** Dùng khi người dùng bấm F5 reload trang, FE gọi lại API này để nạp lại thông tin người dùng nếu cần.

---

## 📢 3. PHÂN HỆ DÀNH CHO NGƯỜI BÁO CÁO (REPORTER PAGE)

### 3.1. Tab 1: Tạo & Gửi sự cố mới

- **Giai đoạn:** `Giai đoạn 1 (Ngày 1)`
- **Endpoint:** `POST /api/incidents`
- **Quyền hạn:** Đã đăng nhập (`student`, `teacher`, `dispatcher`, `admin`)
- **FE gửi lên Body:**
  ```json
  {
    "title": "Chập cầu dao phát tia lửa điện",
    "location": "Phòng A201",
    "type": "Hỏng điện / Nước / Thiết bị", // Hoặc "Tai nạn / Sức khỏe / Cấp cứu"
    "description": "Cầu dao phụ góc tường tóe lửa và có mùi khét, cần thợ điện ngắt át gấp!"
  }
  ```
- **Logic xử lý Backend:**
  - Nếu `type` liên quan thiết bị/điện nước $\rightarrow$ BE tự gán `department = "TECHNICAL"`.
  - Nếu `type` liên quan tai nạn/sức khỏe $\rightarrow$ BE tự gán `department = "MEDICAL"`.
  - `reporter` tự lấy từ `req.user.userId`.
  - _(Ở Giai đoạn 3: Bắn thêm sự kiện Socket.io `new_incident` tới đúng phòng ban)_.
- **BE trả về (201 Created):**
  ```json
  {
    "message": "Gửi báo cáo sự cố thành công.",
    "incident": {
      "_id": "671800112233445566778899",
      "title": "Chập cầu dao phát tia lửa điện",
      "location": "Phòng A201",
      "type": "Hỏng điện / Nước / Thiết bị",
      "department": "TECHNICAL",
      "description": "Cầu dao phụ góc tường...",
      "status": "PENDING",
      "reporter": "6717a1b2c3d4e5f6a7b8c9d0",
      "createdAt": "2026-10-22T09:45:00.000Z"
    }
  }
  ```
- **Ý nghĩa với FE:** Xóa trắng form $\rightarrow$ Hiện Toast xanh thông báo thành công $\rightarrow$ Chuyển sang Tab 2.

---

### 3.2. Tab 2: Lịch sử sự cố của tôi (My Reports)

- **Giai đoạn:** `Giai đoạn 1 (Ngày 2)`
- **Endpoint:** `GET /api/incidents/my-reports`
- **Quyền hạn:** Đã đăng nhập (Reporter)
- **BE trả về (200 OK):**
  ```json
  {
    "incidents": [
      {
        "_id": "671800112233445566778899",
        "title": "Chập cầu dao phát tia lửa điện",
        "location": "Phòng A201",
        "type": "Hỏng điện / Nước / Thiết bị",
        "department": "TECHNICAL",
        "status": "PENDING",
        "createdAt": "2026-10-22T09:45:00.000Z"
      }
    ]
  }
  ```
- **FE sử dụng các trường để làm gì:**
  - `_id`: Dùng làm `key` khi render bảng danh sách (`key={item._id}`).
  - `status`: Dùng để đổi màu Badge trạng thái trên giao diện:
    - `PENDING` $\rightarrow$ Thẻ màu vàng: `"Chờ tiếp nhận"` 🟡
    - `IN_PROGRESS` $\rightarrow$ Thẻ màu xanh dương: `"Đang xử lý"` 🔵
    - `RESOLVED` $\rightarrow$ Thẻ màu xanh lá: `"Đã giải quyết"` 🟢
  - `createdAt`: Hiển thị thời gian gửi (ví dụ: _"15 phút trước"_).
- ⚡ **Gắn Socket.io ở Giai đoạn 3:** FE lắng nghe sự kiện `incident_updated` để tự động đổi màu Badge trạng thái từ Vàng sang Xanh ngay tức thì khi Dispatcher nhận việc hoặc hoàn thành!

---

## 🛠️ 4. PHÂN HỆ DÀNH CHO NHÂN VIÊN ĐIỀU PHỐI (DISPATCHER PAGE)

### 4.1. Tab 1: Sự cố chờ tiếp nhận (Pending Incidents)

#### A. Lấy danh sách sự cố chờ tiếp nhận

- **Giai đoạn:** `Giai đoạn 1 (Ngày 2)`
- **Endpoint:** `GET /api/incidents/pending`
- **Quyền hạn:** `dispatcher`, `admin`
- **Logic xử lý Backend:** Tự động lấy `req.user.department` từ Token để lọc:
  - Kỹ thuật viên chỉ thấy sự cố `status: "PENDING"` và `department: "TECHNICAL"`.
  - Nhân viên Y tế chỉ thấy sự cố `status: "PENDING"` và `department: "MEDICAL"`.
- **BE trả về (200 OK):**
  ```json
  {
    "incidents": [
      {
        "_id": "671800112233445566778899",
        "title": "Chập cầu dao phát tia lửa điện",
        "location": "Phòng A201",
        "description": "Cầu dao phụ góc tường tóe lửa...",
        "department": "TECHNICAL",
        "status": "PENDING",
        "reporter": {
          "_id": "6717a1b2c3d4e5f6a7b8c9d0",
          "fullName": "Cô Trần Thị Lan"
        },
        "createdAt": "2026-10-22T09:45:00.000Z"
      }
    ]
  }
  ```

#### B. Thao tác Bấm nút "Nhận nhiệm vụ"

- **Giai đoạn:** `Giai đoạn 2 (Ngày 3)`
- **Endpoint:** `PATCH /api/incidents/:id/accept`
- **Quyền hạn:** Chỉ dành cho `dispatcher`, `admin` (Học sinh gọi vào bị chặn `403 Forbidden`)
- **Chống táy máy:**
  - Kỹ thuật viên bấm nhận ca Y tế $\rightarrow$ Trả về `403 Forbidden`.
  - Ca đã có người nhận trước $\rightarrow$ Trả về `400 Bad Request`.
- **FE gửi lên Body:** Không cần body (chỉ truyền `id` trên URL).
- **BE trả về (200 OK):**
  ```json
  {
    "message": "Tiếp nhận sự cố thành công.",
    "incident": {
      "_id": "671800112233445566778899",
      "status": "IN_PROGRESS",
      "responder": "6717b999c3d4e5f6a7b8c999"
    }
  }
  ```
- **Ý nghĩa với FE:** Xóa dòng sự cố này khỏi Tab 1 và tự chuyển sang Tab 2 (Đang xử lý).
- ⚡ **Gắn Socket.io ở Giai đoạn 3:**
  - FE lắng nghe `new_incident` $\rightarrow$ Sự cố mới tự động "bay" vào đầu bảng Tab 1.
  - FE lắng nghe `incident_accepted` $\rightarrow$ Nếu đồng nghiệp nhận trước, ca này tự biến mất khỏi màn hình của mình.

---

### 4.2. Tab 2: Sự cố tôi đang xử lý & Đã hoàn thành (My Tasks)

#### A. Lấy danh sách sự cố mình đang làm / đã làm xong

- **Giai đoạn:** `Giai đoạn 1 (Ngày 2)`
- **Endpoint:** `GET /api/incidents/my-tasks`
- **Quyền hạn:** `dispatcher`, `admin`
- **Logic Backend:** Lấy các sự cố có `responder === req.user.userId`.
- **BE trả về (200 OK):**
  ```json
  {
    "tasks": [
      {
        "_id": "671800112233445566778899",
        "title": "Chập cầu dao phát tia lửa điện",
        "location": "Phòng A201",
        "status": "IN_PROGRESS",
        "reporter": { "fullName": "Cô Trần Thị Lan" },
        "createdAt": "2026-10-22T09:45:00.000Z"
      }
    ]
  }
  ```
- **Ý nghĩa với FE:**
  - Ca có `status: "IN_PROGRESS"` $\rightarrow$ Hiển thị nút bấm màu xanh lá **"Hoàn thành"**.
  - Ca có `status: "RESOLVED"` $\rightarrow$ Hiển thị Badge _"Đã xong"_, ẩn nút bấm.

#### B. Thao tác Bấm nút "Hoàn thành"

- **Giai đoạn:** `Giai đoạn 2 (Ngày 4)`
- **Endpoint:** `PATCH /api/incidents/:id/resolve`
- **Quyền hạn:** Chỉ người đang nhận ca này mới được bấm (Người khác bấm vào bị chặn `403 Forbidden`).
- **FE gửi lên Body:**
  ```json
  {
    "resolutionNotes": "Đã ngắt át phụ và thay cầu dao mới an toàn."
  }
  ```
- **BE trả về (200 OK):**
  ```json
  {
    "message": "Đã đánh dấu hoàn thành sự cố.",
    "incident": {
      "_id": "671800112233445566778899",
      "status": "RESOLVED",
      "resolutionNotes": "Đã ngắt át phụ và thay cầu dao mới an toàn."
    }
  }
  ```
- **Ý nghĩa với FE:** Đổi trạng thái sang `RESOLVED`, ẩn nút bấm, hiện ghi chú hoàn thành.

---

## 📊 5. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN DASHBOARD)

### 5.1. Xem & Lọc toàn bộ sự cố toàn trường

- **Giai đoạn:** `Giai đoạn 2 (Ngày 4)`
- **Endpoint:** `GET /api/incidents?status=PENDING&department=TECHNICAL`
- **Quyền hạn:** Chỉ duy nhất `admin` (Role khác gọi vào bị chặn `403 Forbidden`).
- **Query Params hỗ trợ:** `status`, `department`, `page`, `limit`.
- **BE trả về (200 OK):**
  ```json
  {
    "total": 1,
    "incidents": [
      {
        "_id": "671800112233445566778899",
        "title": "Chập cầu dao phát tia lửa điện",
        "location": "Phòng A201",
        "department": "TECHNICAL",
        "status": "IN_PROGRESS",
        "reporter": { "fullName": "Cô Trần Thị Lan" },
        "responder": { "fullName": "Anh Hoàng Văn Tuấn" },
        "createdAt": "2026-10-22T09:45:00.000Z"
      }
    ]
  }
  ```

---

### 5.2. Thống kê & Báo cáo số liệu (Analytics)

- **Giai đoạn:** `Giai đoạn 4 (Ngày 8)`
- **Endpoint:** `GET /api/incidents/analytics`
- **Quyền hạn:** Chỉ duy nhất `admin` (Role khác gọi vào bị chặn `403 Forbidden`).
- **Logic Backend:** Dùng **MongoDB Aggregation Pipeline** để tính toán.
- **BE trả về (200 OK):**
  ```json
  {
    "summary": {
      "total": 35,
      "pending": 5,
      "inProgress": 10,
      "resolved": 20
    },
    "byDepartment": {
      "TECHNICAL": 25,
      "MEDICAL": 10
    },
    "topLocations": [
      { "location": "Phòng A201", "count": 6 },
      { "location": "Lab Hóa", "count": 4 },
      { "location": "Sân bóng", "count": 3 }
    ]
  }
  ```
- **Ý nghĩa với FE:**
  - `summary`: Điền vào 4 ô số tổng quan trên đầu trang.
  - `byDepartment`: Vẽ biểu đồ tròn phân bổ sự cố theo phòng ban.
  - `topLocations`: Vẽ biểu đồ cột hoặc bảng _"Top điểm nóng hư hỏng cơ sở vật chất"_.

---

## ⚡ 6. BẢNG TỔNG HỢP SOCKET.IO REAL-TIME [GIAI ĐOẠN 3 — NGÀY 5-7]

> **Nguyên tắc:** Socket.io không thay thế REST API, mà chỉ là **1 dòng code bổ sung** được bắn ra sau khi lưu Database thành công để FE nhận được tin tức thì mà không cần F5.

| Sự kiện (Event Name)    | Nơi bắn ra (Trigger)                                                  | Phòng nhận (Room)                                    | Gói tin kèm theo                    | Hành vi giao diện Frontend                                                             |
| :---------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------- |
| **`new_incident`**      | Sau khi tạo sự cố thành công ở API `POST /api/incidents`              | `dept_TECHNICAL` hoặc `dept_MEDICAL` và `admin_room` | Object `incident` vừa tạo           | Dispatcher và Admin tự động thấy dòng sự cố mới xuất hiện ở đầu bảng                   |
| **`incident_accepted`** | Sau khi nhận ca thành công ở API `PATCH /accept`                      | `dept_TECHNICAL` hoặc `dept_MEDICAL`                 | `{ incidentId, responderName }`     | Các Dispatcher khác cùng phòng tự động thấy ca này biến mất khỏi Tab 1 (tránh nhận đè) |
| **`incident_updated`**  | Sau khi Nhận ca hoặc Hoàn thành ca ở API `PATCH /accept` & `/resolve` | `user_<reporterId>` và `admin_room`                  | `{ incidentId, status, responder }` | Reporter và Admin tự động thấy Badge trạng thái đổi màu từ Vàng $\rightarrow$ Xanh     |
