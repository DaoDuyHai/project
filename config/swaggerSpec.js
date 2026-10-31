export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'School Incident Dispatch API',
    version: '1.0.0',
    description:
      'Hệ thống Backend RESTful API & Real-time Event Dispatching phục vụ điều phối và xử lý sự cố học đường. Xây dựng bằng Node.js Express 5, MongoDB, Socket.io, JWT RBAC và Docker.',
    contact: {
      name: 'Đào Duy Hải',
      url: 'https://github.com/DaoDuyHai/school-incident-dispatch',
    },
  },
  servers: [
    {
      url: 'https://school-incident-dispatch.fly.dev',
      description: 'Production Server (Fly.io Singapore)',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT Token nhận được từ endpoint /api/users/login',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description message' },
          requestId: {
            type: 'string',
            example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6adb4f9f534ccd47cc874e1' },
          userName: { type: 'string', example: 'student01' },
          fullName: { type: 'string', example: 'Nguyễn Văn A' },
          role: {
            type: 'string',
            enum: ['student', 'teacher', 'dispatcher', 'admin'],
            example: 'student',
          },
          department: {
            type: 'string',
            enum: ['TECHNICAL', 'MEDICAL', 'GENERAL'],
            example: 'GENERAL',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Incident: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6adb4f9f534ccd47cc874e2' },
          title: {
            type: 'string',
            example: 'Máy chiếu phòng B204 không lên nguồn',
          },
          location: { type: 'string', example: 'Phòng học B204, Tòa B' },
          type: {
            type: 'string',
            enum: [
              'Hỏng điện/Nước/Thiết bị',
              'Sơ cứu/Y tế',
              'Vệ sinh/Môi trường',
              'Khác',
            ],
            example: 'Hỏng điện/Nước/Thiết bị',
          },
          department: {
            type: 'string',
            enum: ['TECHNICAL', 'MEDICAL'],
            example: 'TECHNICAL',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
            example: 'PENDING',
          },
          reporter: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              fullName: { type: 'string' },
              userName: { type: 'string' },
            },
          },
          responder: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              fullName: { type: 'string' },
              department: { type: 'string' },
            },
          },
          resolutionNotes: { type: 'string', nullable: true },
          resolvedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Analytics: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              kpi: {
                type: 'object',
                properties: {
                  total: { type: 'number', example: 45 },
                  pending: { type: 'number', example: 5 },
                  inProgress: { type: 'number', example: 12 },
                  resolved: { type: 'number', example: 28 },
                },
              },
              departmentDistribution: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    department: { type: 'string', example: 'TECHNICAL' },
                    count: { type: 'number', example: 30 },
                  },
                },
              },
              topHotspots: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', example: 'Phòng học B204' },
                    count: { type: 'number', example: 8 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Readiness & Health Check Probe',
        description:
          'Kiểm tra tình trạng sống của container, kết nối MongoDB và tài nguyên bộ nhớ.',
        tags: ['System'],
        responses: {
          200: {
            description: 'Hệ thống hoạt động bình thường (UP)',
          },
          503: {
            description: 'Dịch vụ gặp sự cố kết nối Database (DOWN)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/register': {
      post: {
        summary: 'Đăng ký tài khoản mới',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userName', 'password', 'fullName'],
                properties: {
                  userName: { type: 'string', example: 'student_new' },
                  password: { type: 'string', example: 'securePass123' },
                  fullName: { type: 'string', example: 'Lê Hoàng Nam' },
                  role: {
                    type: 'string',
                    enum: ['student', 'teacher'],
                    example: 'student',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Tạo tài khoản thành công' },
          400: {
            description: 'Dữ liệu không hợp lệ hoặc thiếu trường bắt buộc',
          },
          409: { description: 'Tên người dùng đã tồn tại' },
        },
      },
    },
    '/api/users/login': {
      post: {
        summary: 'Đăng nhập lấy Token xác thực (JWT)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userName', 'password'],
                properties: {
                  userName: { type: 'string', example: 'student01' },
                  password: { type: 'string', example: '123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Đăng nhập thành công, trả về Bearer Token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful.' },
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Sai tên đăng nhập hoặc mật khẩu' },
        },
      },
    },
    '/api/users/me': {
      get: {
        summary: 'Lấy thông tin người dùng hiện tại',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Thông tin người dùng đang đăng nhập' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
        },
      },
    },
    '/api/incidents': {
      post: {
        summary: 'Báo cáo sự cố mới',
        description:
          'Học sinh hoặc Giáo viên tạo sự cố mới, hệ thống tự động phân loại phòng ban và bắn WebSocket thông báo.',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'location', 'type'],
                properties: {
                  title: {
                    type: 'string',
                    example: 'Vòi nước bồn rửa nhà xe bị gãy phun nước',
                  },
                  location: { type: 'string', example: 'Khu vệ sinh Nhà xe A' },
                  type: {
                    type: 'string',
                    enum: [
                      'Hỏng điện/Nước/Thiết bị',
                      'Sơ cứu/Y tế',
                      'Vệ sinh/Môi trường',
                      'Khác',
                    ],
                    example: 'Hỏng điện/Nước/Thiết bị',
                  },
                  description: {
                    type: 'string',
                    example: 'Cần sửa gấp trong sáng nay',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Tạo sự cố thành công, trạng thái PENDING' },
          400: { description: 'Dữ liệu thiếu hoặc không hợp lệ' },
        },
      },
      get: {
        summary: 'Lấy danh sách tất cả sự cố (Phân trang & Lọc)',
        tags: ['Incidents (Admin)'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
            },
          },
          {
            name: 'department',
            in: 'query',
            schema: { type: 'string', enum: ['TECHNICAL', 'MEDICAL'] },
          },
        ],
        responses: {
          200: {
            description: 'Danh sách sự cố phân trang kèm tổng số bản ghi',
          },
          403: {
            description: 'Quyền truy cập bị từ chối (Chỉ dành cho Admin)',
          },
        },
      },
    },
    '/api/incidents/pending': {
      get: {
        summary: 'Xem sự cố chờ tiếp nhận theo khoa',
        tags: ['Incidents (Dispatcher)'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description:
              'Danh sách các sự cố trạng thái PENDING thuộc khoa của Dispatcher',
          },
          403: {
            description: 'Chỉ nhân viên Dispatcher mới có quyền truy cập',
          },
        },
      },
    },
    '/api/incidents/my-incidents': {
      get: {
        summary: 'Lịch sử sự cố do bản thân báo cáo',
        tags: ['Incidents (Reporter)'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Danh sách sự cố của chính người dùng đăng nhập',
          },
        },
      },
    },
    '/api/incidents/{id}': {
      get: {
        summary: 'Xem chi tiết sự cố theo ID',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Mã ObjectId sự cố',
          },
        ],
        responses: {
          200: { description: 'Chi tiết thông tin sự cố' },
          404: { description: 'Không tìm thấy sự cố với ID đã cho' },
        },
      },
    },
    '/api/incidents/{id}/accept': {
      patch: {
        summary: 'Tiếp nhận sự cố (Khóa nguyên tử chống Race Condition)',
        description:
          'Dispatcher nhận xử lý sự cố. Sử dụng findOneAndUpdate nguyên tử. Nếu ca đã được người khác nhận trước, trả về 409 Conflict.',
        tags: ['Incidents (Dispatcher)'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description:
              'Tiếp nhận thành công, trạng thái chuyển sang IN_PROGRESS',
          },
          403: {
            description: 'Nhân viên khác khoa không được tiếp nhận ca này',
          },
          409: {
            description:
              'Xung đột Race Condition: Sự cố đã được kỹ thuật viên khác tiếp nhận trước đó',
          },
        },
      },
    },
    '/api/incidents/{id}/resolve': {
      patch: {
        summary: 'Hoàn tất nghiệm thu sự cố',
        tags: ['Incidents (Dispatcher)'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resolutionNotes'],
                properties: {
                  resolutionNotes: {
                    type: 'string',
                    example:
                      'Đã thay mới linh kiện và kiểm tra chạy thử an toàn.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Nghiệm thu thành công, trạng thái chuyển sang RESOLVED',
          },
          403: { description: 'Chỉ người phụ trách ca mới được quyền đóng ca' },
        },
      },
    },
    '/api/incidents/analytics': {
      get: {
        summary: 'Thống kê KPI & Phân tích điểm nóng (MongoDB Aggregation)',
        tags: ['Analytics (Admin)'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description:
              'Thống kê tổng số, tỷ lệ theo khoa, và Top 3 điểm nóng sự cố',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Analytics' },
              },
            },
          },
          403: { description: 'Chỉ Admin mới có quyền truy cập' },
        },
      },
    },
  },
};

export default swaggerDocument;
