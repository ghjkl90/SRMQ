// src/components/pages/OrderDetailPage.jsx — 결제 상세 (무통장입금 신청 완료 화면 겸용)
import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Alert, Button, ButtonLink, Card, ConfirmDialog, MemberPage, MemberPageHeader, Spinner } from '../member/MemberUI';
import { DepositGuide, OrderInfoList } from '../member/OrderSummary';
import { ArrowRightIcon } from '../member/icons';

export default function OrderDetailPage() {
  const { orderNo } = useParams();
  const [params] = useSearchParams();
  const justCreated = params.get('created') === '1';
  const justPaid = params.get('paid') === '1';
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/api/orders/${encodeURIComponent(orderNo)}`).then((d) => setOrder(d.order)).catch((err) => setError(err));
  }, [orderNo]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async () => {
    setBusy(true);
    try {
      const d = await api.post(`/api/orders/${encodeURIComponent(orderNo)}/cancel`);
      setOrder(d.order);
      setConfirmCancel(false);
    } catch (err) {
      setError(err);
      setConfirmCancel(false);
    } finally {
      setBusy(false);
    }
  };

  const canCancel = order && (order.status === 'READY' || (order.method === 'BANK_TRANSFER' && order.status === 'WAITING_FOR_DEPOSIT'));

  return (
    <MemberPage>
      <MemberPageHeader badge="회원서비스" badgeEn="PAYMENT DETAIL" title="결제 상세" desc="회비 결제 · 입금 진행 상황을 확인할 수 있습니다." />

      {error && <Alert tone="danger">{error.message}</Alert>}
      {!order && !error && <Spinner label="결제 정보를 불러오는 중입니다" />}

      {order && (
        <>
          {justCreated && order.status === 'WAITING_FOR_DEPOSIT' && (
            <Alert tone="success" title="무통장입금 신청이 완료되었습니다">
              입금 정보는 가입하신 이메일로도 보내 드렸습니다. 입금이 확인되면 회원 자격이 자동으로 반영됩니다.
            </Alert>
          )}

          {justPaid && order.status === 'PAID' && (
            <Alert tone="success" title="결제가 완료되었습니다">
              회원 자격이 바로 반영되었습니다. 마이페이지에서 회원 등급과 자격 기간을 확인할 수 있습니다.
              {order.method === 'TEST' && ' (0원 테스트 결제 — 실제로 청구된 금액은 없습니다)'}
            </Alert>
          )}

          {order.status === 'WAITING_FOR_DEPOSIT' && (
            <Card title="입금 안내">
              <DepositGuide order={order} />
            </Card>
          )}

          <Card title="결제 정보">
            <OrderInfoList order={order} />
            <div className="ms-actions is-between">
              <div>
                {canCancel && (
                  <Button variant="danger-outline" size="sm" onClick={() => setConfirmCancel(true)}>신청 취소</Button>
                )}
              </div>
              <div className="ms-actions-group">
                <ButtonLink to="/mypage?tab=orders" variant="outline">결제 내역</ButtonLink>
                <ButtonLink to="/mypage" iconRight={<ArrowRightIcon size={15} />}>마이페이지</ButtonLink>
              </div>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="입금 신청을 취소할까요?"
        confirmLabel="신청 취소"
        tone="danger"
        busy={busy}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={cancel}
      >
        이미 입금하셨다면 취소하지 말고 사무국(02-408-9171)으로 연락해 주세요.
      </ConfirmDialog>
    </MemberPage>
  );
}
