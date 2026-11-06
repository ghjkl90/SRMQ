// src/components/member/OrderSummary.jsx — 결제(주문) 정보 표 + 입금 안내 (결제 완료 · 결제 상세 화면 공통)
import { BankAccountBox, CopyButton, OrderStatusBadge } from './MemberUI';
import { METHOD_LABEL, ORDER_TYPE_LABEL, RECEIPT_TYPE_LABEL, formatDate, formatDateTime, formatWon } from './membership';

export function DepositGuide({ order }) {
  if (order.status !== 'WAITING_FOR_DEPOSIT') return null;
  if (order.method === 'BANK_TRANSFER' && order.bankAccount) {
    return (
      <div className="ms-stack" style={{ gap: 8 }}>
        <BankAccountBox {...order.bankAccount} amount={formatWon(order.amount)} />
        <p className="ms-hint">
          입금자명 <b className="ms-strong">{order.depositorName}</b>(으)로 <b className="ms-strong">{formatDate(order.depositDueAt)}</b>까지 입금해 주세요. 사무국에서 입금을 확인하면 회원 자격이 반영되고 메일로 알려 드립니다.
        </p>
      </div>
    );
  }
  if (order.virtualAccount) {
    const va = order.virtualAccount;
    return (
      <div className="ms-stack" style={{ gap: 8 }}>
        <div className="ms-account">
          <span className="ms-account-bank">{va.bankName}</span>
          <span className="ms-account-number">{va.accountNumber}</span>
          <span className="ms-account-holder">/ 예금주: {va.customerName || '(사)사회적책임경영품질원'}</span>
          <span className="ms-account-amount">{formatWon(order.amount)}</span>
          <CopyButton text={va.accountNumber} className="ms-account-copy" />
        </div>
        <p className="ms-hint">발급된 가상계좌로 <b className="ms-strong">{formatDateTime(va.dueDate)}</b>까지 입금해 주세요. 입금이 확인되면 자동으로 회원 자격이 반영됩니다.</p>
      </div>
    );
  }
  return null;
}

export function OrderInfoList({ order, plan }) {
  return (
    <dl className="ms-kv">
      <dt>상태</dt>
      <dd><OrderStatusBadge status={order.status} /></dd>
      <dt>주문번호</dt>
      <dd className="ms-mono">{order.orderNo}</dd>
      <dt>결제 내용</dt>
      <dd>
        {order.orderName}
        <span className="ms-cell-sub">{ORDER_TYPE_LABEL[order.orderType]}{plan ? ` · ${plan.name}` : ''}</span>
      </dd>
      <dt>결제 금액</dt>
      <dd>
        <span className="ms-amount">{formatWon(order.amount)}</span>
        <span className="ms-cell-sub">
          {order.items
            ?.map((i, n) => `${n === 0 ? '' : i.amount < 0 ? ' − ' : ' + '}${i.label} ${formatWon(Math.abs(i.amount))}`)
            .join('')}
        </span>
      </dd>
      <dt>결제 수단</dt>
      <dd>{order.payMethodLabel || METHOD_LABEL[order.method]}</dd>
      {order.method === 'BANK_TRANSFER' && order.receiptType !== 'NONE' && (
        <>
          <dt>증빙 신청</dt>
          <dd>{RECEIPT_TYPE_LABEL[order.receiptType]} <span className="ms-cell-sub">사무국에서 입금 확인 후 발급합니다.</span></dd>
        </>
      )}
      {order.designatedPurpose && (
        <>
          <dt>사용용도 지정</dt>
          <dd>{order.designatedPurpose}</dd>
        </>
      )}
      <dt>신청 일시</dt>
      <dd>{formatDateTime(order.createdAt)}</dd>
      {order.paidAt && (
        <>
          <dt>결제 일시</dt>
          <dd>{formatDateTime(order.paidAt)}</dd>
        </>
      )}
      {order.canceledAt && (
        <>
          <dt>취소 일시</dt>
          <dd>{formatDateTime(order.canceledAt)}</dd>
        </>
      )}
      {order.failureMessage && order.status === 'FAILED' && (
        <>
          <dt>실패 사유</dt>
          <dd className="ms-red">{order.failureMessage}</dd>
        </>
      )}
      {order.receiptUrl && order.status === 'PAID' && (
        <>
          <dt>영수증</dt>
          <dd>
            <a className="ms-link" href={order.receiptUrl} target="_blank" rel="noopener noreferrer">카드 · 간편결제 영수증 보기</a>
          </dd>
        </>
      )}
    </dl>
  );
}
