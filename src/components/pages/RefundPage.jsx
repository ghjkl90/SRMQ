// src/components/pages/RefundPage.jsx — 사이트 하단 링크로 여는 정책 페이지 (문구: member/terms.js)
import PolicyDocument from '../member/PolicyDocument';
import { REFUND_POLICY } from '../member/terms';

export default function RefundPage() {
  return (
    <PolicyDocument
      badge="환불 · 취소"
      badgeEn="REFUND"
      title="환불 · 취소 정책"
      desc="회비 결제 후 회원 자격이 시작되는 시점과 취소 · 환불 기준입니다."
      text={REFUND_POLICY}
    />
  );
}
