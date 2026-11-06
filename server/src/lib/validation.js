// src/lib/validation.js
import { z } from 'zod';
import { HttpError } from './errors.js';

/** zod 검증 실패를 { fields: { 필드명: 메시지 } } 형태의 400 오류로 바꿉니다. */
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  const first = Object.values(fields)[0] || '입력값을 확인해 주세요.';
  throw new HttpError(400, 'VALIDATION_ERROR', first, fields);
}

const digits = (value) => String(value ?? '').replace(/\D/g, '');

export function normalizeMobile(value) {
  const d = digits(value);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return value;
}

export function normalizeBizNo(value) {
  const d = digits(value);
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : value;
}

export const emailSchema = z
  .string({ error: '이메일을 입력해 주세요.' })
  .trim()
  .toLowerCase()
  .pipe(z.email('올바른 이메일 형식이 아닙니다.').max(120, '이메일이 너무 깁니다.'));

// 회원가입 화면 안내와 동일: 영문 · 숫자 · 특수문자 조합 8~16자
export const passwordSchema = z
  .string({ error: '비밀번호를 입력해 주세요.' })
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .max(16, '비밀번호는 16자 이하여야 합니다.')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9\s]/.test(v), {
    message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
  })
  .refine((v) => !/\s/.test(v), { message: '비밀번호에 공백을 쓸 수 없습니다.' });

export const mobileSchema = z
  .string({ error: '휴대전화 번호를 입력해 주세요.' })
  .trim()
  .refine((v) => /^01[016789]\d{7,8}$/.test(digits(v)), {
    message: '휴대전화 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)',
  })
  .transform(normalizeMobile);

const optionalText = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label}은(는) ${max}자 이하로 입력해 주세요.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((v) => !v || /^\d{8,12}$/.test(digits(v)), { message: '전화번호 형식이 올바르지 않습니다.' })
  .transform((v) => (v ? v : null));

export const bizNoSchema = z
  .string({ error: '사업자등록번호를 입력해 주세요.' })
  .trim()
  .refine((v) => digits(v).length === 10, { message: '사업자등록번호 10자리를 입력해 주세요.' })
  .transform(normalizeBizNo);

export const text = optionalText;

export const nameSchema = z
  .string({ error: '이름을 입력해 주세요.' })
  .trim()
  .min(2, '이름을 2자 이상 입력해 주세요.')
  .max(40, '이름은 40자 이하로 입력해 주세요.');

export const idParam = z.coerce.number().int().positive();
