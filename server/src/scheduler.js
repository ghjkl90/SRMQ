// src/scheduler.js
// 30분마다: 입금기한 지난 주문 만료 · 승인 중 멈춘 주문 정리 · 쓰이지 않는 업로드 파일 삭제
import { expireStaleOrders, reconcileStuckOrders } from './services/orders.js';
import { cleanupUploads } from './services/gallery.js';

export function startScheduler({ db, toss, storage, intervalMs = 30 * 60 * 1000 }) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const expired = await expireStaleOrders(db);
      const reconciled = await reconcileStuckOrders(db, toss);
      const cleaned = await cleanupUploads(db, storage);
      if (expired.bank || expired.ready || reconciled || cleaned) {
        console.log('[scheduler]', { expiredBank: expired.bank, expiredReady: expired.ready, reconciled, cleaned });
      }
    } catch (err) {
      console.error('[scheduler] 실패', err);
    } finally {
      running = false;
    }
  };

  const first = setTimeout(tick, 15_000);
  const timer = setInterval(tick, intervalMs);
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
