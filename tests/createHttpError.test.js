import { describe, it, expect } from 'vitest';
import { createHttpError } from '../utils/createHttpError.js';

describe('createHttpError - Hàm tạo lỗi HTTP tùy chỉnh', () => {
  // 1. Nhóm kiểm thử thông thường (Happy Path)
  describe('1. Trường hợp thông thường (Happy Path)', () => {
    it('1. Nên khởi tạo thành công Error object với message và statusCode hợp lệ', () => {
      const err = createHttpError('Resource not found', 404);

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Resource not found');
      expect(err.statusCode).toBe(404);
    });

    it('2. Phải bảo toàn prototype của lớp Error gốc (name là "Error" và có stack trace)', () => {
      const err = createHttpError('Internal Server Error', 500);

      expect(err.name).toBe('Error');
      expect(err.stack).toBeDefined();
      expect(typeof err.stack).toBe('string');
    });

    it('3. Hoạt động chính xác với các mã trạng thái nghiệp vụ phổ biến (400, 401, 403, 409)', () => {
      const badRequest = createHttpError('Bad request', 400);
      const unauthorized = createHttpError('Unauthorized', 401);
      const forbidden = createHttpError('Forbidden', 403);
      const conflict = createHttpError('Incident already accepted', 409);

      expect(badRequest.statusCode).toBe(400);
      expect(unauthorized.statusCode).toBe(401);
      expect(forbidden.statusCode).toBe(403);
      expect(conflict.statusCode).toBe(409);
    });
  });

  // 2. Nhóm kiểm thử biên cho tham số message (Edge Cases - Message)
  describe('2. Biên dữ liệu của tham số message', () => {
    it('4. Xử lý khi message là chuỗi rỗng ("")', () => {
      const err = createHttpError('', 400);

      expect(err.message).toBe('');
      expect(err.statusCode).toBe(400);
    });

    it('5. Xử lý khi không truyền tham số nào (message mặc định là rỗng)', () => {
      const err = createHttpError();

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('');
      expect(err.statusCode).toBeUndefined();
    });

    it('6. Xử lý khi message không phải là string (số, null, undefined) mà không gây crash', () => {
      const errWithNumber = createHttpError(12345, 500);
      const errWithNull = createHttpError(null, 400);

      // JavaScript Error constructor tự động ép kiểu thành chuỗi
      expect(errWithNumber.message).toBe('12345');
      expect(errWithNull.message).toBe('null');
    });
  });

  // 3. Nhóm kiểm thử biên cho tham số statusCode (Edge Cases - StatusCode)
  describe('3. Biên dữ liệu của tham số statusCode', () => {
    it('7. Xử lý khi bỏ qua statusCode (statusCode nhận giá trị undefined)', () => {
      const err = createHttpError('Error without status code');

      expect(err.message).toBe('Error without status code');
      expect(err.statusCode).toBeUndefined();
    });

    it('8. Xử lý khi truyền statusCode đặc biệt (số 0 hoặc số âm)', () => {
      const errZero = createHttpError('Zero status', 0);
      const errNegative = createHttpError('Negative status', -1);

      expect(errZero.statusCode).toBe(0);
      expect(errNegative.statusCode).toBe(-1);
    });

    it('9. Xử lý khi statusCode được truyền dưới dạng chuỗi số ("404")', () => {
      const err = createHttpError('Not found as string code', '404');

      expect(err.statusCode).toBe('404');
    });
  });

  // 4. Nhóm kiểm thử hành vi ném lỗi (Throw & Catch Runtime)
  describe('4. Hành vi ném và bắt lỗi trong luồng thực thi (Throw & Catch)', () => {
    it('10. Có thể được ném ra (throw) và bắt lại (catch) trong khối try...catch với đầy đủ thuộc tính', () => {
      expect(() => {
        throw createHttpError('Token expired', 401);
      }).toThrow('Token expired');

      try {
        throw createHttpError('Forbidden access', 403);
      } catch (caughtError) {
        expect(caughtError).toBeInstanceOf(Error);
        expect(caughtError.message).toBe('Forbidden access');
        expect(caughtError.statusCode).toBe(403);
      }
    });
  });
});
