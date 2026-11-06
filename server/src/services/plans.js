// src/services/plans.js
import { notFound } from '../lib/errors.js';

export function serializePlan(row) {
  if (!row) return null;
  return {
    code: row.code,
    category: row.category, // GENERAL | CORPORATE | SPECIAL
    name: row.name,
    nameEn: row.name_en,
    shortLabel: row.short_label,
    joinFee: row.join_fee,
    annualFee: row.annual_fee,
    term: row.term, // ANNUAL | PERMANENT | LIFETIME
    memberType: row.member_type, // INDIVIDUAL | ORGANIZATION | ANY
    votingRights: row.voting_rights,
    benefits: row.benefits ?? [],
    badgeTone: row.badge_tone,
    sortOrder: row.sort_order,
  };
}

export async function listPlans(db) {
  const { rows } = await db.query(
    'SELECT * FROM membership_plans WHERE is_active ORDER BY sort_order, code',
  );
  return rows;
}

export async function getPlan(db, code, { activeOnly = true } = {}) {
  const { rows } = await db.query(
    `SELECT * FROM membership_plans WHERE code = $1 ${activeOnly ? 'AND is_active' : ''}`,
    [code],
  );
  if (!rows[0]) throw notFound('존재하지 않는 회원 유형입니다.');
  return rows[0];
}
