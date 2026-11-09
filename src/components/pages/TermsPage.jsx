// src/components/pages/TermsPage.jsx — 사이트 하단 링크로 여는 정책 페이지 (문구: member/terms.js)
import PolicyDocument from '../member/PolicyDocument';
import { TERMS_OF_SERVICE } from '../member/terms';

export default function TermsPage() {
  return (
    <PolicyDocument
      badge="이용약관"
      badgeEn="TERMS"
      title="이용약관"
      desc="사경원 홈페이지 회원 서비스의 이용 조건과 회원의 권리 · 의무입니다."
      text={TERMS_OF_SERVICE}
    />
  );
}
