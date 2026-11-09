import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_INFO, privacyOfficerText } from '../data/siteInfo';
import './SiteFooter.css';

export default function SiteFooter() {
  const s = SITE_INFO;

  const lines = [
    [
      ['상호', s.name],
      ['대표자', s.representative],
      [s.bizNoLabel, s.bizNo],
      ['주소', s.address],
    ],
    [
      ['전화', s.tel],
      ['팩스', s.fax],
      ['이메일', s.email],
      ['개인정보 보호책임자', privacyOfficerText()],
    ],
  ].map((line) => line.filter(([, value]) => value));

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* 상단: 규정 및 약관 링크 */}
        <nav className="site-footer-links" aria-label="약관 및 정책">
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy" className="is-strong">개인정보처리방침</Link>
          <Link to="/refund">환불 · 취소 정책</Link>
          <Link to="/members">회원 안내 · 회비</Link>
        </nav>

        {/* 중단: 기관 기본 정보 */}
        {lines.map((line, i) => (
          <dl className="site-footer-info" key={i}>
            {line.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ))}

        {/* PG 심사 대비 필수 명시 문구 */}
        <p className="site-footer-notice">
          * 회비 납부 및 프로그램 등록 취소 시 행사 개시 전 전액 환불 가능하며, 세미나 및 교육 진행 후에는 잔여 일정에 따라 환불 규정이 적용됩니다.
        </p>

        {/* 하단: 카피라이트 */}
        <p className="site-footer-copy">
          © {new Date().getFullYear()} {s.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}