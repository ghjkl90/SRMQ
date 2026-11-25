import React from 'react';
import { Link } from 'react-router-dom';
import { groupPlans, planFeeText, useMembershipPlans } from '../../hooks/useMembershipPlans';
import { FALLBACK_PLANS } from '../../data/membershipPlans';
import PlanCardArt from '../member/PlanCardArt';
import { formatWon, renewalText, usagePeriodText } from '../member/membership';
import './SubpageLayout.css';
import './MembersPage.css';
import '../member/memberService.css';

const SECTIONS = [
  { category: 'GENERAL', title: '일반 회원', desc: '개인 · 단체가 가입하는 회원입니다. 총회 의결권은 정회원 · 준회원에 한합니다.' },
  { category: 'CORPORATE', title: '기업 회원', desc: '기업 · 기관이 가입하는 회원으로, 우수사례 공유 · 컨벤션 참석 · 교육 혜택을 드립니다.' },
  { category: 'SPECIAL', title: '특별 회원', desc: '본원 발전을 후원하는 기업 · 기관 회원입니다.' },
];

const totalOf = (plan) => plan.joinFee + plan.annualFee;

function ProductCard({ plan }) {
  return (
    <article className="member-product" id={`plan-${plan.code}`}>
      <PlanCardArt plan={plan} />
      <div className="member-product-body">
        <h4 className="member-product-name">
          {plan.name}
          <span>{plan.nameEn}</span>
        </h4>
        <ul className="member-list">
          {plan.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <dl className="member-product-meta">
          <div>
            <dt>결제 금액</dt>
            <dd>
              <strong>{formatWon(totalOf(plan))}</strong>
              <small>{planFeeText(plan)}</small>
            </dd>
          </div>
          <div>
            <dt>이용 기간</dt>
            <dd>
              {usagePeriodText(plan)}
              <small>{renewalText(plan)}</small>
            </dd>
          </div>
        </dl>
        <Link to={`/membership/checkout?plan=${plan.code}`} className="ms-btn ms-btn-primary member-product-buy">
          결제하기
        </Link>
      </div>
    </article>
  );
}

export default function MemberPage() {
  const { plans: loaded, error } = useMembershipPlans();
  const plans = loaded || (error ? FALLBACK_PLANS : null);
  const grouped = groupPlans(plans || FALLBACK_PLANS);
  const maxTotal = Math.max(...(plans || FALLBACK_PLANS).map(totalOf));

  return (
    <div className="subpage-container">
      <div className="subpage-content">
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">회원 안내</span>
            <span className="subpage-badge-en">MEMBERSHIP</span>
          </div>
          <h1 className="subpage-title">회원 안내</h1>
          <p className="subpage-desc">
            본원은 사회적책임 · 경영품질 · 안전보건경영에 관심 있는분의 회원 가입을 환영하며, 특히 산업체에 종사하는 분들의 참여를 적극 권장합니다. 회원가입은 본원 홈페이지(www.srmq.or.kr)에서 가능하며, 아래에서 회원 유형을 고른 뒤 바로 회비를 결제할 수 있습니다.
          </p>
        </header>

        <div className="member-body">
          {SECTIONS.map(({ category, title, desc }) => (
            <section key={category} className={`member-section-box${category === 'SPECIAL' ? ' special-box' : ''}`}>
              <h3 className="section-title">{title}</h3>
              <p className="member-section-desc">{desc}</p>
              <div className={`member-product-grid is-${category.toLowerCase()}${plans ? '' : ' is-loading'}`} aria-busy={!plans}>
                {grouped[category].map((plan) => (
                  <ProductCard key={plan.code} plan={plan} />
                ))}
              </div>
            </section>
          ))}

          <section className="member-section-box member-pay-info" aria-labelledby="member-pay-info-title">
            <h3 className="section-title" id="member-pay-info-title">결제 및 이용 안내</h3>
            <dl className="member-info-table">
              <div>
                <dt>상품 형태</dt>
                <dd>온라인으로 제공하는 회원 자격(무형 서비스)이며, 따로 배송하는 상품은 없습니다.</dd>
              </div>
              <div>
                <dt>사용 주기</dt>
                <dd>
                  모든 회원 등급은 1회 결제 시 <strong>결제일부터 1년</strong> 이용합니다. 정기결제(자동결제)는 하지 않으며, 기간 연장은 만료 전에 회원이 연회비를 직접 결제합니다.
                </dd>
              </div>
              <div>
                <dt>이용 시작</dt>
                <dd>
                  카드 · 간편결제는 결제 즉시, 무통장입금은 사무국이 입금을 확인한 뒤(영업일 기준 1~2일) 회원 자격이 시작됩니다.
                  무통장입금은 신청 후 7일 안에 입금하지 않으면 신청이 자동 취소됩니다.
                </dd>
              </div>
              <div>
                <dt>결제 수단</dt>
                <dd>
                  카드 · 간편결제(토스페이먼츠), 무통장입금 · 1회 최대 결제 금액 {formatWon(maxTotal)}
                  <small>하나카드는 카드사 정책에 따라 이용할 수 없습니다.</small>
                </dd>
              </div>
              <div>
                <dt>취소 · 환불</dt>
                <dd>
                  결제일부터 7일 이내 · 회원 혜택을 이용하지 않은 경우 전액 환불합니다.{' '}
                  <Link to="/refund" className="ms-link">환불 · 취소 정책 보기</Link>
                </dd>
              </div>
            </dl>
          </section>

          <div className="ms-cta">
            <div>
              <p className="ms-cta-title">사경원 회원이 되어 주세요</p>
              <p className="ms-cta-text">
                홈페이지에서 회원가입 후 카드 · 간편결제 또는 무통장입금으로 회비를 납부하시면 회원 자격이 바로 시작됩니다.
              </p>
            </div>
            <div className="ms-actions-group">
              <Link to="/signup" className="ms-btn ms-btn-outline">회원가입</Link>
              <Link to="/membership/checkout" className="ms-btn ms-btn-primary">회비 납부하기</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
