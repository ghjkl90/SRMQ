// src/components/pages/PrivacyPage.jsx — 사이트 하단 링크로 여는 정책 페이지 (문구: member/terms.js)
import PolicyDocument from '../member/PolicyDocument';
import { PRIVACY_POLICY } from '../member/terms';

export default function PrivacyPage() {
  return (
    <PolicyDocument
      badge="개인정보처리방침"
      badgeEn="PRIVACY"
      title="개인정보처리방침"
      desc="본원이 회원의 개인정보를 어떻게 처리하고 보호하는지 알려 드립니다."
      text={PRIVACY_POLICY}
    />
  );
}
