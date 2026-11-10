// src/services/emails.js
// 안내 메일 문구. 문구를 바꿀 때는 이 파일만 수정하면 됩니다.
import { formatKstDate, formatWon } from '../lib/dates.js';

const SIGNATURE = '\n\n(사)사회적책임경영품질원 사무국\nTel. 02-408-9171 · srmq@srmq.or.kr';

const wrap = (title, bodyHtml) => `
<div style="font-family:Pretendard,'Apple SD Gothic Neo',sans-serif;max-width:560px;margin:0 auto;color:#334155">
  <div style="border-top:4px solid #74B816;padding:24px 4px">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#4B9321">사회적책임경영품질원 SRMQ</p>
    <h1 style="margin:0 0 20px;font-size:20px;color:#0F172A">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:28px;font-size:12px;color:#64748B;line-height:1.6">
      (사)사회적책임경영품질원 사무국 · Tel. 02-408-9171 · srmq@srmq.or.kr
    </p>
  </div>
</div>`;

const escape = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function passwordResetEmail({ name, link }) {
  return {
    subject: '[사경원] 비밀번호 재설정 안내',
    text: `${name}님, 아래 링크에서 30분 안에 새 비밀번호를 설정해 주세요.\n${link}\n\n본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.${SIGNATURE}`,
    html: wrap(
      '비밀번호 재설정 안내',
      `<p style="line-height:1.7">${escape(name)}님, 아래 버튼을 눌러 <b>30분 안에</b> 새 비밀번호를 설정해 주세요.</p>
       <p style="margin:24px 0"><a href="${escape(link)}" style="background:#74B816;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:700">비밀번호 재설정</a></p>
       <p style="font-size:13px;color:#64748B">본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>`,
    ),
  };
}

export function bankTransferEmail({ name, order, bank }) {
  const due = formatKstDate(order.deposit_due_at);
  const lines = [
    `주문번호: ${order.order_no}`,
    `결제내용: ${order.order_name}`,
    `입금금액: ${formatWon(order.amount)}`,
    `입금계좌: ${bank.name} ${bank.accountNumber} (예금주: ${bank.holder})`,
    `입금자명: ${order.depositor_name}`,
    `입금기한: ${due}까지`,
  ];
  return {
    subject: `[사경원] 회비 무통장입금 안내 (${order.order_no})`,
    text: `${name}님, 회비 입금 정보를 안내드립니다.\n\n${lines.join('\n')}\n\n입금이 확인되면 회원 자격이 자동으로 반영되고 안내 메일을 보내드립니다.${SIGNATURE}`,
    html: wrap(
      '회비 무통장입금 안내',
      `<p style="line-height:1.7">${escape(name)}님, 회비 입금 정보를 안내드립니다.</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
         ${lines
           .map((l) => {
             const [k, ...v] = l.split(': ');
             return `<tr><th style="text-align:left;padding:8px 10px;background:#F1F5F9;width:30%;border-bottom:1px solid #E2E8F0">${escape(k)}</th><td style="padding:8px 10px;border-bottom:1px solid #E2E8F0">${escape(v.join(': '))}</td></tr>`;
           })
           .join('')}
       </table>
       <p style="font-size:13px;color:#64748B">입금자명이 다르면 확인이 늦어질 수 있습니다. 입금이 확인되면 회원 자격이 반영됩니다.</p>`,
    ),
  };
}

export function paymentCompletedEmail({ name, order, planName, expiresAt }) {
  const period = expiresAt ? `${formatKstDate(expiresAt)}까지` : '기한 없음';
  return {
    subject: `[사경원] 회비 결제가 완료되었습니다 (${planName})`,
    text: `${name}님, ${order.order_name} 결제가 완료되어 ${planName} 자격이 반영되었습니다.\n\n결제금액: ${formatWon(order.amount)}\n자격기간: ${period}\n주문번호: ${order.order_no}${SIGNATURE}`,
    html: wrap(
      '회비 결제가 완료되었습니다',
      `<p style="line-height:1.7">${escape(name)}님, <b>${escape(planName)}</b> 자격이 반영되었습니다. 함께해 주셔서 감사합니다.</p>
       <p style="font-size:14px;line-height:1.8;background:#F1F5F9;padding:14px 16px;border-radius:8px">
         결제금액 <b>${formatWon(order.amount)}</b><br/>자격기간 ${escape(period)}<br/>주문번호 ${escape(order.order_no)}
       </p>`,
    ),
  };
}

export function adminNewDepositEmail({ order, user, appOrigin }) {
  return {
    subject: `[사경원 관리자] 무통장입금 신청 ${formatWon(order.amount)} · ${order.depositor_name}`,
    text: `새 무통장입금 신청이 있습니다.\n\n회원: ${user.name} (${user.email})\n내용: ${order.order_name}\n금액: ${formatWon(order.amount)}\n입금자명: ${order.depositor_name}\n입금기한: ${formatKstDate(order.deposit_due_at)}\n\n입금 확인: ${appOrigin}/admin?tab=deposits`,
  };
}
