// src/components/pages/DonationPage.jsx
import { useEffect, useRef, useState } from "react";
import "./SubpageLayout.css";
import "./DonationPage.css";

const BANK_NAME = "KB국민은행";
const ACCOUNT_NUMBER = "821301-00-058386";
const ACCOUNT_HOLDER = "(사)사회적책임경영품질원";

const PURPOSES = [
  {
    mark: "가",
    text: "사회적책임, ESG경영 및 경영품질 정기 컨벤션 개최",
    note: "(매년 11월초)",
  },
  { mark: "나", text: "사회적책임, ESG경영 및 경영품질 연구개발, 도서 출간 및 보급 사업" },
  { mark: "다", text: "정부정책 제안 및 산학협력 사업" },
  { mark: "라", text: "기타 사회적책임, ESG경영 및 경영품질 관련 신사업 개발 등" },
];

const BENEFITS = [
  {
    mark: "가",
    text: "지정기부금 납부영수증 발급을 통한 세제혜택",
    pill: "법인 10% / 개인 15~30% 소득공제",
    tone: "green",
  },
  {
    mark: "나",
    text: "사경원 출간 도서 증정",
    pill: "경영품질 · ESG 연구총서",
    tone: "teal",
  },
];

/* 공통 SVG 아이콘 래퍼 */
const Icon = ({ children, size = 20, className = "" }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const MoneyIcon = () => (
  <Icon>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </Icon>
);

const PiggyBankIcon = () => (
  <Icon>
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <path d="M16 11h.01" />
  </Icon>
);

const BookmarkIcon = () => (
  <Icon>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </Icon>
);

const MegaphoneIcon = () => (
  <Icon>
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </Icon>
);

const BankIcon = () => (
  <Icon size={15} className="donation-bank-icon">
    <path d="M3 22h18" />
    <path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7" />
    <path d="M12 2 20 7H4z" />
  </Icon>
);

const CopyIcon = () => (
  <Icon size={13}>
    <rect x="8" y="8" width="14" height="14" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);

const CheckIcon = () => (
  <Icon size={13}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

const ClockIcon = () => (
  <Icon size={11}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

/* 인사말 카드 우측 하단 워터마크 잎사귀 */
const LeafWatermark = () => (
  <svg className="donation-leaf" viewBox="0 0 120 120" aria-hidden="true">
    <path d="M22 104C14 62 40 22 108 12c4 52-22 92-78 94-3 0-6-1-8-2z" />
    <path d="M24 102C46 78 66 56 92 30" className="donation-leaf-vein" />
  </svg>
);

/* 가/나/다/라 마커 리스트 */
const MarkList = ({ items, renderExtra }) => (
  <ul className="donation-mark-list">
    {items.map((item) => (
      <li key={item.mark} className="donation-mark-item">
        <span className="donation-mark">{item.mark}</span>
        <span className="donation-mark-text">{item.text}</span>
        {renderExtra && renderExtra(item)}
      </li>
    ))}
  </ul>
);

/* 타임라인 한 단계 */
const Step = ({ icon, title, tag, children }) => (
  <section className="donation-step">
    <div className="donation-step-icon">{icon}</div>
    <div className="donation-step-body">
      <div className="donation-step-head">
        <h3 className="donation-step-title">{title}</h3>
        {tag && <span className="donation-step-tag">{tag}</span>}
      </div>
      {children}
    </div>
  </section>
);

const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // http 환경 등 Clipboard API를 쓸 수 없을 때의 대체 경로
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const DonationPage = () => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async () => {
    try {
      await copyToClipboard(ACCOUNT_NUMBER);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("계좌번호 복사 실패:", err);
    }
  };

  return (
    <div className="subpage-container">
      <div className="subpage-content">
        {/* 페이지 헤더 (SubpageLayout.css 공통) */}
        <header className="subpage-header">
          <div className="subpage-badge-box">
            <span className="subpage-badge-kr">기부금후원</span>
            <span className="subpage-badge-en">DONATION &amp; SUPPORT</span>
          </div>
          <h1 className="subpage-title">기부금 후원 안내</h1>
        </header>

        {/* 본문: 인사말 + 타임라인 (내부 간격은 기존 그대로) */}
        <div className="donation-body">
          {/* 인사말 */}
          <article className="donation-greeting">
            <p className="donation-greeting-hello">안녕하십니까?</p>
            <p>
              (사)사회적책임경영품질원(이하, 사경원)에 대해 항상 많은 애정과 후원을 보내
              주신데 대해 진심으로 감사드립니다.
            </p>
            <p>
              사경원은 글로벌경영환경에서 우리 기업이 국제경쟁력 강화를 위해, 사회적책임경영,
              경영품질, ESG경영, 환경과 안전보건 등 국제 기준에 부합하는 시스템과 능력을
              갖추도록 지원하고, 이에 대한 정부시책을 적극적으로 뒷받침 하고자 2012년 12월
              설립된 기획재정부 등록 비영리 법인입니다.
            </p>
            <p>
              사경원은 설립목적에 따른 목적 사업의 효과적인 수행에 필요한 재원 확보를 위해,
              2013년 12월 기획재정부로부터 「법인세법 시행령」 제39조 제1항에 따라
              지정기부금단체로 지정받아 운영하고 있습니다.
            </p>
            <p>
              기부금의 사용 목적 및 후원 계좌를 아래와 같이 안내드리오니 여러분의 따뜻한
              후원의 손길을 보내주시기를 부탁드립니다.
            </p>
            <hr className="donation-greeting-divider" />
            <p className="donation-greeting-thanks">감사합니다.</p>
            <LeafWatermark />
          </article>

          {/* 타임라인 */}
          <div className="donation-timeline">
            <Step icon={<MoneyIcon />} title="기부금 사용 목적">
              <MarkList
                items={PURPOSES}
                renderExtra={(item) =>
                  item.note && <span className="donation-mark-note">{item.note}</span>
                }
              />
            </Step>

            <Step icon={<PiggyBankIcon />} title="기부금 후원 계좌">
              <div className="donation-account">
                <span className="donation-bank">
                  <BankIcon />
                  {BANK_NAME}
                </span>
                <span className="donation-account-number">{ACCOUNT_NUMBER}</span>
                <span className="donation-account-holder">/ 예금주: {ACCOUNT_HOLDER}</span>
                <button
                  type="button"
                  className={`donation-copy-btn${copied ? " is-copied" : ""}`}
                  onClick={handleCopy}
                  aria-live="polite"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "복사됨" : "계좌 복사"}
                </button>
              </div>
            </Step>

            <Step icon={<BookmarkIcon />} title="혜택" tag="기부자 혜택">
              <MarkList
                items={BENEFITS}
                renderExtra={(item) => (
                  <span className={`donation-pill donation-pill-${item.tone}`}>
                    {item.pill}
                  </span>
                )}
              />
            </Step>

            <Step
              icon={<MegaphoneIcon />}
              title="문의처"
              tag={
                <>
                  <ClockIcon />
                  상담가능시간: 평일 09:00 ~ 18:00
                </>
              }
            >
              <ul className="donation-contact-list">
                <li className="donation-contact-org">{ACCOUNT_HOLDER} 사무국</li>
                <li>
                  Tel: <a href="tel:02-2025-9171">02-2025-9171~2</a>
                </li>
                <li>
                  E-mail:{" "}
                  <a className="donation-contact-email" href="mailto:srmq@srmq.or.kr">
                    srmq@srmq.or.kr
                  </a>
                </li>
              </ul>
            </Step>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
