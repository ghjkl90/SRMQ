// src/components/pages/PaymentFailPage.jsx — 토스페이먼츠 결제 실패 · 취소 시 돌아오는 화면(failUrl)
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ButtonLink, Card, MemberPage, MemberPageHeader } from '../member/MemberUI';
import { AlertIcon } from '../member/icons';

const FRIENDLY = {
  PAY_PROCESS_CANCELED: '결제를 취소하셨습니다.',
  PAY_PROCESS_ABORTED: '결제가 중단되었습니다. 잠시 후 다시 시도해 주세요.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 카드 정보와 한도를 확인해 주세요.',
};

export default function PaymentFailPage() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const message = FRIENDLY[code] || params.get('message') || '결제를 완료하지 못했습니다.';
  const orderId = params.get('orderId');
  const cleaned = useRef(false);

  // 결제창에서 나온 주문은 정리 (다시 결제하면 새 주문이 만들어집니다)
  useEffect(() => {
    if (cleaned.current || !orderId) return;
    cleaned.current = true;
    api.post(`/api/orders/${encodeURIComponent(orderId)}/cancel`).catch(() => {});
  }, [orderId]);

  return (
    <MemberPage>
      <MemberPageHeader badge="회원서비스" badgeEn="PAYMENT FAILED" title="회비 결제" />
      <Card>
        <div className="ms-result">
          <div className="ms-result-icon is-danger"><AlertIcon size={26} /></div>
          <h2 className="ms-result-title">{code === 'PAY_PROCESS_CANCELED' ? '결제가 취소되었습니다' : '결제에 실패했습니다'}</h2>
          <p className="ms-result-text">{message}</p>
          {code && <p className="ms-muted ms-text-sm ms-mono" style={{ margin: 0 }}>오류 코드: {code}</p>}
        </div>
        <div className="ms-actions">
          <ButtonLink to="/mypage" variant="outline">마이페이지</ButtonLink>
          <ButtonLink to="/membership/checkout">다시 결제하기</ButtonLink>
        </div>
      </Card>
    </MemberPage>
  );
}
