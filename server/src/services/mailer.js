// src/services/mailer.js
// SMTP 설정이 없으면 메일을 보내지 않고 서버 로그에 내용을 남깁니다. (개발용)
import nodemailer from 'nodemailer';

export function createMailer(mailConfig, { mode = 'auto', log = console.log } = {}) {
  const outbox = [];
  const useMemory = mode === 'memory';
  const useSmtp = !useMemory && Boolean(mailConfig.host);

  const transport = useSmtp
    ? nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: mailConfig.user ? { user: mailConfig.user, pass: mailConfig.pass } : undefined,
      })
    : null;

  async function send({ to, subject, text, html }) {
    if (!to) return;
    const message = { from: mailConfig.from, to, subject, text, html };
    if (useMemory) {
      outbox.push(message);
      return;
    }
    if (!transport) {
      log(`[mail:dev] to=${to} subject=${subject}\n${text}`);
      return;
    }
    try {
      await transport.sendMail(message);
    } catch (err) {
      // 메일 실패가 결제 · 가입 처리를 막지 않도록 로그만 남깁니다.
      console.error('[mail] 발송 실패', subject, err.message);
    }
  }

  return { send, outbox, adminNotify: mailConfig.adminNotify };
}
