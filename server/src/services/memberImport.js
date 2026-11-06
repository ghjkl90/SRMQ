// src/services/memberImport.js
// 회원명부(CSV) → 회원 계정 + 회비 납부 완료 상태(자격 ACTIVE)로 등록
//
// - 이메일이 아이디입니다. 이메일이 없는 행은 건너뛰고 이유를 알려 줍니다.
// - 새로 만든 계정은 비밀번호가 없습니다(password_set = false).
//   회원은 로그인 화면의 '비밀번호 찾기'로 비밀번호를 만들고, 그때 약관에 동의합니다.
// - 같은 이메일이 이미 있으면 새로 만들지 않습니다. 여러 번 실행해도 안전합니다.
//   · 명부로 만든 계정(사이트 결제 전): CSV 를 고쳐 다시 실행하면 등급 · 기간 · 연락처가 그대로 반영
//   · 홈페이지에서 가입했거나 결제한 계정: 자격이 살아 있으면 건드리지 않음
import { addYears, formatKstDate } from '../lib/dates.js';
import { hashPassword, newCustomerKey, randomToken } from '../lib/security.js';

const HEADER_ALIASES = {
  name: ['성명', '이름', 'name'],
  email: ['이메일', '메일', 'email', 'e-mail'],
  phone: ['휴대폰', '핸드폰', '휴대전화', '연락처', 'phone', 'mobile'],
  affiliation: ['소속', '소속기관', '기관', 'affiliation', 'organization'],
  plan: ['등급', '회원등급', '회원유형', 'plan', 'plancode'],
  startedAt: ['자격시작', '자격 시작', '시작일', 'startedat', 'started'],
  expiresAt: ['만료일', '자격만료', '자격 만료', 'expiresat', 'expires'],
  memo: ['메모', '비고', 'memo', 'note'],
};

const PLAN_NAMES = {
  준회원: 'ASSOCIATE',
  정회원: 'REGULAR',
  종신회원: 'LIFETIME',
  평생회원: 'LIFETIME',
  단체회원: 'GROUP',
  '내셔널 ESG': 'NES',
  '베스트 ESG': 'BES',
  '글로벌 ESG': 'GES',
  특별회원: 'SPECIAL',
};

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** RFC 4180 CSV (따옴표 · 쉼표 · 줄바꿈이 들어간 칸 지원). 엑셀의 "CSV UTF-8" 저장 파일을 그대로 읽습니다. */
export function parseCsv(text) {
  const src = String(text).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** 머리글(한글/영문 아무거나)을 읽어 { name, email, ... } 객체 목록으로 바꿉니다. */
export function rowsToRecords(rows) {
  if (!rows.length) return [];
  const key = (h) => String(h).trim().toLowerCase().replace(/\s+/g, ' ');
  const header = rows[0].map(key);
  const index = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const at = header.findIndex((h) => aliases.some((a) => key(a) === h));
    if (at >= 0) index[field] = at;
  }
  if (index.name === undefined || index.email === undefined) {
    throw new Error('CSV 첫 줄에 "성명" 과 "이메일" 머리글이 있어야 합니다.');
  }
  return rows.slice(1).map((r, i) => {
    const get = (f) => (index[f] === undefined ? '' : String(r[index[f]] ?? '').trim());
    return {
      line: i + 2,
      name: get('name'),
      email: get('email'),
      phone: get('phone'),
      affiliation: get('affiliation'),
      plan: get('plan'),
      startedAt: get('startedAt'),
      expiresAt: get('expiresAt'),
      memo: get('memo'),
    };
  });
}

function normalizePhone(value) {
  const m = String(value || '').match(/0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/);
  if (!m) return '';
  const d = m[0].replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return d.startsWith('02') ? `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return m[0];
}

const kstStart = (ymd) => new Date(`${ymd}T00:00:00+09:00`);
const kstEnd = (ymd) => new Date(`${ymd}T23:59:59+09:00`);

/**
 * @param {object} db              createDb() 결과
 * @param {Array}  records         rowsToRecords() 결과
 * @param {object} options
 *   defaultPlan   등급 칸이 비었을 때 (기본 정회원)
 *   startedAt     자격시작 칸이 비었을 때 'YYYY-MM-DD' (기본 오늘)
 *   expiresAt     만료일 칸이 비었을 때 'YYYY-MM-DD' (기본 시작일 + 1년, 연회비 등급만)
 *   dryRun        true 면 확인만 하고 저장하지 않음
 */
export async function importMembers(db, records, { defaultPlan = 'REGULAR', startedAt = null, expiresAt = null, dryRun = false, now = new Date() } = {}) {
  const plans = Object.fromEntries((await db.query('SELECT * FROM membership_plans')).rows.map((p) => [p.code, p]));
  const result = { created: [], updated: [], unchanged: [], skipped: [] };
  const seen = new Set();
  const today = formatKstDate(now).replace(/\./g, '-');
  const ROLLBACK = Symbol('dry-run');

  try {
    await db.tx(async (client) => {
      for (const r of records) {
        const email = (String(r.email).match(EMAIL_RE)?.[0] || '').toLowerCase();
        if (!r.name) {
          result.skipped.push({ line: r.line, name: r.name, reason: '성명이 비어 있음' });
          continue;
        }
        if (!email) {
          result.skipped.push({ line: r.line, name: r.name, reason: '이메일 없음 (이메일을 채운 뒤 다시 실행하면 등록됩니다)' });
          continue;
        }
        if (seen.has(email)) {
          result.skipped.push({ line: r.line, name: r.name, reason: `같은 이메일이 위에 이미 있음 (${email})` });
          continue;
        }
        seen.add(email);

        const planCode = PLAN_NAMES[r.plan] || (plans[String(r.plan).toUpperCase()] ? String(r.plan).toUpperCase() : null) || (r.plan ? null : defaultPlan);
        const plan = plans[planCode];
        if (!plan) {
          result.skipped.push({ line: r.line, name: r.name, reason: `알 수 없는 등급: ${r.plan}` });
          continue;
        }
        const startYmd = DATE_RE.test(r.startedAt) ? r.startedAt : startedAt || today;
        let expires = null;
        if (plan.term === 'ANNUAL') {
          const ymd = DATE_RE.test(r.expiresAt) ? r.expiresAt : expiresAt;
          expires = ymd ? kstEnd(ymd) : addYears(kstStart(startYmd), 1);
        }
        const started = kstStart(startYmd);
        const memo = `[${formatKstDate(now)}] 회원명부 이관 · ${plan.name} 납부 확인${r.memo ? ` · ${r.memo}` : ''}`;
        const phone = normalizePhone(r.phone);
        const memberType = plan.member_type === 'ORGANIZATION' ? 'ORGANIZATION' : 'INDIVIDUAL';

        const existing = (await client.query('SELECT * FROM users WHERE email = $1 FOR UPDATE', [email])).rows[0];
        if (existing?.status === 'WITHDRAWN') {
          result.skipped.push({ line: r.line, name: r.name, reason: '탈퇴한 계정' });
          continue;
        }

        if (!existing) {
          const passwordHash = await hashPassword(`${randomToken(24)}!Aa1`);
          const { rows } = await client.query(
            `INSERT INTO users
               (email, password_hash, password_set, source, member_type, name, phone, affiliation,
                plan_code, membership_status, membership_started_at, membership_expires_at,
                terms_agreed_at, privacy_agreed_at, customer_key, admin_memo)
             VALUES ($1, $2, false, 'IMPORT', $3, $4, $5, $6, $7, 'ACTIVE', $8, $9, NULL, NULL, $10, $11)
             RETURNING id`,
            [email, passwordHash, memberType, r.name.slice(0, 40), phone, r.affiliation.slice(0, 80) || null, plan.code, started, expires, newCustomerKey(), memo],
          );
          await client.query(
            `INSERT INTO payment_events (order_no, source, event_type, payload) VALUES (NULL, 'SYSTEM', 'MEMBERSHIP_IMPORT', $1)`,
            [{ userId: rows[0].id, planCode: plan.code, expiresAt: expires }],
          );
          result.created.push({ line: r.line, name: r.name, email, plan: plan.name, expiresAt: expires });
          continue;
        }

        const currentEnd = existing.membership_expires_at ? new Date(existing.membership_expires_at) : null;

        // 명부로 만든 계정이고 아직 사이트에서 결제한 적이 없으면 → 명부(CSV)가 기준: 등급 · 기간 · 연락처를 고친 대로 반영
        if (existing.source === 'IMPORT' && !existing.membership_order_id) {
          const same =
            existing.plan_code === plan.code &&
            existing.membership_status === 'ACTIVE' &&
            (currentEnd?.getTime() ?? null) === (expires?.getTime() ?? null) &&
            new Date(existing.membership_started_at).getTime() === started.getTime() &&
            existing.name === r.name.slice(0, 40) &&
            (existing.phone || '') === (phone || existing.phone || '') &&
            (existing.affiliation || null) === (r.affiliation.slice(0, 80) || existing.affiliation || null);
          if (same) {
            result.unchanged.push({ line: r.line, name: r.name, email, reason: '명부 내용과 같음' });
            continue;
          }
          await client.query(
            `UPDATE users
                SET plan_code = $2, membership_status = 'ACTIVE', membership_started_at = $3, membership_expires_at = $4,
                    member_type = $5, name = $6, phone = CASE WHEN $7 <> '' THEN $7 ELSE phone END,
                    affiliation = COALESCE($8, affiliation), updated_at = now()
              WHERE id = $1`,
            [existing.id, plan.code, started, expires, memberType, r.name.slice(0, 40), phone, r.affiliation.slice(0, 80) || null],
          );
          await client.query(
            `INSERT INTO payment_events (order_no, source, event_type, payload) VALUES (NULL, 'SYSTEM', 'MEMBERSHIP_IMPORT', $1)`,
            [{ userId: existing.id, planCode: plan.code, expiresAt: expires, corrected: true }],
          );
          result.updated.push({ line: r.line, name: r.name, email, plan: plan.name, expiresAt: expires });
          continue;
        }

        // 홈페이지에서 가입했거나 결제한 적이 있는 계정: 자격이 살아 있으면(등급 무관) 그대로 두고, 없거나 만료됐으면 명부 기준으로 반영
        const stillActive = existing.membership_status === 'ACTIVE' && (currentEnd === null || currentEnd >= now);
        if (stillActive) {
          result.unchanged.push({ line: r.line, name: r.name, email, reason: '이미 회비 납부 자격이 있음 (그대로 둠)' });
          continue;
        }
        await client.query(
          `UPDATE users
              SET plan_code = $2, membership_status = 'ACTIVE',
                  membership_started_at = COALESCE(membership_started_at, $3), membership_expires_at = $4,
                  membership_order_id = NULL,
                  name = CASE WHEN source = 'IMPORT' THEN $5 ELSE name END,
                  phone = CASE WHEN source = 'IMPORT' AND $6 <> '' THEN $6 ELSE phone END,
                  affiliation = CASE WHEN source = 'IMPORT' AND $7::text IS NOT NULL THEN $7 ELSE affiliation END,
                  admin_memo = CONCAT_WS(E'\\n', admin_memo, $8::text), updated_at = now()
            WHERE id = $1`,
          [existing.id, plan.code, started, expires, r.name.slice(0, 40), phone, r.affiliation.slice(0, 80) || null, memo],
        );
        await client.query(
          `INSERT INTO payment_events (order_no, source, event_type, payload) VALUES (NULL, 'SYSTEM', 'MEMBERSHIP_IMPORT', $1)`,
          [{ userId: existing.id, planCode: plan.code, expiresAt: expires, existing: true }],
        );
        result.updated.push({ line: r.line, name: r.name, email, plan: plan.name, expiresAt: expires });
      }
      if (dryRun) throw ROLLBACK;
    });
  } catch (err) {
    if (err !== ROLLBACK) throw err;
  }
  return result;
}
