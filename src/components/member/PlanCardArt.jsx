// src/components/member/PlanCardArt.jsx
// 회원 등급(회비 상품)의 대표 이미지 — 회원증 모양 카드. 회원 안내(상품 목록)와 결제 화면에서 함께 씁니다.
import logo from '../../assets/logo.png';

export default function PlanCardArt({ plan, size = 'md' }) {
  if (!plan) return null;
  return (
    <div
      className={`ms-plan-art tone-${plan.badgeTone || 'lime'} is-${size}`}
      role="img"
      aria-label={`${plan.name} 회원 카드 이미지`}
    >
      <span className="ms-plan-art-top">
        <img src={logo} alt="" className="ms-plan-art-logo" />
        <span className="ms-plan-art-org">SRMQ MEMBERSHIP</span>
      </span>
      <span className="ms-plan-art-name">{plan.nameEn}</span>
      <span className="ms-plan-art-bottom">
        <span className="ms-plan-art-kr">{plan.name}</span>
        {plan.shortLabel && plan.shortLabel !== plan.name && <span className="ms-plan-art-code">{plan.shortLabel}</span>}
      </span>
    </div>
  );
}
