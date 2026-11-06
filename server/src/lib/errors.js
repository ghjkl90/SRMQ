// src/lib/errors.js
// API 오류는 항상 { error: { code, message, fields? } } 형태로 응답합니다.

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const badRequest = (message, fields) => new HttpError(400, 'BAD_REQUEST', message, fields);
export const unauthorized = (message = '로그인이 필요합니다.') =>
  new HttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = '권한이 없습니다.') => new HttpError(403, 'FORBIDDEN', message);
export const notFound = (message = '대상을 찾을 수 없습니다.') =>
  new HttpError(404, 'NOT_FOUND', message);
export const conflict = (code, message, extra) => {
  const err = new HttpError(409, code, message);
  if (extra) err.extra = extra;
  return err;
};
