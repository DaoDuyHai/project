import { describe, it, expect } from 'vitest';
import { createHttpError } from '../utils/createHttpError';

describe('Kiem thu ham gom loi', () => {
  it('Truong hop dung', () => {
    const err = createHttpError('Not Found', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not Found');
    expect(err.statusCode).toBe(404);
  });
});

describe('Thu truyen vao message mot chuoi', () => {
  it('Truyen vao chuoi rong', () => {
    const err = createHttpError('');
    expect(err.message).toBe('');
    expect(err.statusCode).toBeUndefined();
  });
});
