// src/components/pages/PaymentSuccessPage.jsx — 토스페이먼츠 결제 인증 성공 후 돌아오는 화면(successUrl)
// 주소의 paymentKey · orderId · amount 로 서버에 "결제 승인"을 요청합니다. (승인은 반드시 서버에서)
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Alert, ButtonLink, Card, MemberPage, MemberPageHeader, Spinner } from '../member/MemberUI';
import { DepositGuide, OrderInfoList } from '../member/OrderSummary';
import { AlertIcon, ArrowRightIcon, CheckIcon, ClockIcon } from '../member/icons';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const startedRef = useRef(false);
  const [state, setState] = useState({ phase: 'confirming', order: null, error: null });

  useEffect(() => {
    if (startedRef.current) return; // 개발 모드(StrictMode)에서 두 번 호출되지 않도록
    startedRef.current = true;

    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));
    if (!paymentKey || !orderId || !amount) {
      setState({ phase: 'error', order: null, error: '결제 정보가 올바르지 않습니다.' });
      return;
    }

    (async () => {
      try {
        const { order } = await api.post('/api/payments/toss/confirm', { paymentKey, orderId, amount });
        setState({ phase: 'done', order, error: null });
        refresh();
      } catch (err) {
        // 다른 탭 등에서 이미 승인 중이면 잠시 후 주문 상태를 다시 확인
        if (err.code === 'PAYMENT_PROCESSING') {
          for (let i = 0; i < 5; i += 1) {
            await wait(1500);
            try {
              const { order } = await api.get(`/api/orders/${orderId}`);
              if (['PAID', 'WAITING_FOR_DEPOSIT'].includes(order.status)) {
                setState({ phase: 'done', order, error: null });
                refresh();
                return;
              }
            } catch {
              /* 다시 시도 */
            }
          }
        }
        setState({ phase: 'error', order: null, error: err.message });
      }
    })();
  }, [params, refresh]);

  const { phase, order, error } = state;
  const waiting = order?.status === 'WAITING_FOR_DEPOSIT';

  return (
    <MemberPage>
      <MemberPageHeader badge="회원서비스" badgeEn="PAYMENT COMPLETE" title="회비 결제" />

      {phase === 'confirming' && (
        <Card>
          <Spinner label="결제를 승인하고 있습니다. 창을 닫지 말고 잠시만 기다려 주세요." />
        </Card>
      )}

      {phase === 'error' && (
        <Card>
          <div className="ms-result">
            <div className="ms-result-icon is-danger"><AlertIcon size={26} /></div>
            <h2 className="ms-result-title">결제를 완료하지 못했습니다</h2>
            <p className="ms-result-text">{error}</p>
          </div>
          <Alert tone="info" className="ms-mt-16">
            카드 승인이 되었는데 이 화면이 보인다면 결제가 자동 취소되거나 곧 반영됩니다. 문제가 계속되면 사무국(02-2025-9171~2)으로 문의해 주세요.
          </Alert>
          <div className="ms-actions">
            <ButtonLink to="/mypage?tab=orders" variant="outline">결제 내역 확인</ButtonLink>
            <ButtonLink to="/membership/checkout">다시 결제하기</ButtonLink>
          </div>
        </Card>
      )}

      {phase === 'done' && order && (
        <Card>
          <div className="ms-result">
            <div className={`ms-result-icon${waiting ? ' is-warn' : ''}`}>
              {waiting ? <ClockIcon size={26} /> : <CheckIcon size={28} strokeWidth={2.6} />}
            </div>
            <h2 className="ms-result-title">{waiting ? '가상계좌가 발급되었습니다' : '회비 결제가 완료되었습니다'}</h2>
            <p className="ms-result-text">
              {waiting
                ? '아래 계좌로 기한 안에 입금하시면 회원 자격이 자동으로 반영됩니다.'
                : '회원 자격이 바로 반영되었습니다. 사회적책임경영품질원과 함께해 주셔서 감사합니다.'}
            </p>
          </div>
          {waiting && (
            <div style={{ marginTop: 20 }}>
              <DepositGuide order={order} />
            </div>
          )}
          <div style={{ marginTop: 24 }}>
            <OrderInfoList order={order} />
          </div>
          <div className="ms-actions">
            <ButtonLink to="/mypage?tab=orders" variant="outline">결제 내역</ButtonLink>
            <ButtonLink to="/mypage" iconRight={<ArrowRightIcon size={15} />}>마이페이지로 이동</ButtonLink>
          </div>
        </Card>
      )}
    </MemberPage>
  );
}
