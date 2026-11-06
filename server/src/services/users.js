// src/services/users.js
import { serializePlan } from './plans.js';
import { effectiveMembershipStatus } from './membership.js';

export async function findUserById(db, id) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function findActiveUserByEmail(db, email) {
  const { rows } = await db.query(`SELECT * FROM users WHERE email = $1 AND status = 'ACTIVE'`, [email]);
  return rows[0] ?? null;
}

/** 화면에 내려보내는 회원 정보 (비밀번호 해시 등 내부 값 제외) */
export function serializeUser(user, planRow = null) {
  if (!user) return null;
  const status = effectiveMembershipStatus(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    memberType: user.member_type,
    name: user.name,
    phone: user.phone,
    officePhone: user.office_phone,
    affiliation: user.affiliation,
    department: user.department,
    position: user.position,
    companyName: user.company_name,
    businessNo: user.business_no,
    ceoName: user.ceo_name,
    taxEmail: user.tax_email,
    smsOptIn: user.sms_opt_in,
    marketingOptIn: user.marketing_opt_in,
    customerKey: user.customer_key,
    createdAt: user.created_at,
    membership: {
      planCode: user.plan_code, // 회원가입 때 고른 등급 또는 현재 등급
      status, // NONE(미납) | ACTIVE | EXPIRED
      startedAt: user.membership_started_at,
      expiresAt: user.membership_expires_at,
      plan: planRow ? serializePlan(planRow) : null,
    },
  };
}

export async function loadSerializedUser(db, userId) {
  const { rows } = await db.query(
    `SELECT u.*, row_to_json(p.*) AS plan_row
       FROM users u LEFT JOIN membership_plans p ON p.code = u.plan_code
      WHERE u.id = $1`,
    [userId],
  );
  if (!rows[0]) return null;
  return serializeUser(rows[0], rows[0].plan_row);
}
