// src/components/member/MemberUI.jsx
// 회원 서비스(로그인 · 회원가입 · 마이페이지 · 결제 · 관리자) 화면이 함께 쓰는 UI 조각.
// 페이지 상단 뱃지/제목/설명은 기존 SubpageLayout.css 의 subpage- 클래스를 그대로 써서
// 다른 서브페이지와 뱃지 위치 · 간격이 똑같이 유지됩니다.
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../pages/SubpageLayout.css';
import './memberService.css';
import { AlertIcon, CheckIcon, ChevronRightIcon, CopyIcon, EyeIcon, EyeOffIcon, InfoIcon } from './icons';
import { MEMBERSHIP_STATUS, ORDER_STATUS } from './membership';

const cx = (...names) => names.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* 페이지 틀                                                            */
/* ------------------------------------------------------------------ */

/**
 * width: 'narrow'(로그인 480px) | 'default'(폼 1040px) | 'wide'(관리자 전체 폭)
 */
export function MemberPage({ width = 'default', children }) {
  return (
    <div className="subpage-container">
      <div className="subpage-content">
        <div className={cx('ms-page', `ms-page--${width}`)}>{children}</div>
      </div>
    </div>
  );
}

export function MemberPageHeader({ badge, badgeEn, title, desc, aside }) {
  return (
    <header className="subpage-header ms-page-header">
      <div className="subpage-badge-box">
        <span className="subpage-badge-kr">{badge}</span>
        {badgeEn && <span className="subpage-badge-en">{badgeEn}</span>}
      </div>
      <div className="ms-page-title-row">
        <h1 className="subpage-title">{title}</h1>
        {aside}
      </div>
      {desc && <p className="subpage-desc">{desc}</p>}
    </header>
  );
}

export function Card({ title, aside, children, className, padded = true, ...rest }) {
  return (
    <section className={cx('ms-card', !padded && 'ms-card--flush', className)} {...rest}>
      {(title || aside) && (
        <div className="ms-card-head">
          {title && <h2 className="ms-card-title">{title}</h2>}
          {aside && <div className="ms-card-aside">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionTitle({ children, aside }) {
  return (
    <div className="ms-section-head">
      <h3 className="ms-section-title">{children}</h3>
      {aside && <span className="ms-section-aside">{aside}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 폼                                                                  */
/* ------------------------------------------------------------------ */

export function FormRow({ label, required, htmlFor, hint, error, ok, children, sub }) {
  return (
    <div className={cx('ms-form-row', error && 'has-error')}>
      <label className="ms-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ms-req" aria-label="필수">*</span>}
        {sub && <span className="ms-label-sub">{sub}</span>}
      </label>
      <div className="ms-control">
        {children}
        {error ? (
          <p className="ms-error" role="alert">{error}</p>
        ) : hint ? (
          <p className={cx('ms-hint', ok && 'is-ok')}>
            {ok && <CheckIcon size={13} strokeWidth={2.6} />}
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PasswordInput({ id, value, onChange, placeholder, autoComplete = 'current-password', invalid, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="ms-input-wrap">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={cx('ms-input', invalid && 'is-invalid')}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={16}
        {...rest}
      />
      <button
        type="button"
        className="ms-input-icon-btn"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
      >
        {show ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
      </button>
    </div>
  );
}

export function Checkbox({ checked, onChange, children, sub, id, disabled, className }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label className={cx('ms-check', disabled && 'is-disabled', className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="ms-check-text">
        {children}
        {sub && <span className="ms-check-sub">{sub}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* 버튼 · 뱃지 · 안내                                                   */
/* ------------------------------------------------------------------ */

export const Button = forwardRef(function Button(
  { variant = 'primary', size, block, loading, icon, iconRight, children, className, type = 'button', disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('ms-btn', `ms-btn-${variant}`, size && `ms-btn-${size}`, block && 'ms-btn-block', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="ms-spinner ms-spinner--sm" aria-hidden="true" /> : icon}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});

export function ButtonLink({ to, variant = 'primary', size, block, icon, iconRight, children, className, ...rest }) {
  return (
    <Link to={to} className={cx('ms-btn', `ms-btn-${variant}`, size && `ms-btn-${size}`, block && 'ms-btn-block', className)} {...rest}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </Link>
  );
}

export function Badge({ tone = 'slate', children, className }) {
  return <span className={cx('ms-badge', `ms-badge--${tone}`, className)}>{children}</span>;
}

/** 회원등급 뱃지 (회원 안내 페이지의 NES · BES · GES 뱃지와 같은 모양) */
export function PlanBadge({ plan, label, tone, className }) {
  if (!plan && !label) return null;
  return (
    <span className={cx('ms-plan-badge', `tone-${tone || plan?.badgeTone || 'lime'}`, className)}>
      {label || plan.shortLabel || plan.name}
    </span>
  );
}

export function MembershipStatusBadge({ status }) {
  const s = MEMBERSHIP_STATUS[status] || MEMBERSHIP_STATUS.NONE;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function OrderStatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Alert({ tone = 'info', title, children, action, className }) {
  const Icon = tone === 'info' || tone === 'success' ? (tone === 'success' ? CheckIcon : InfoIcon) : AlertIcon;
  return (
    <div className={cx('ms-alert', `ms-alert--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={17} className="ms-alert-icon" />
      <div className="ms-alert-body">
        {title && <strong className="ms-alert-title">{title}</strong>}
        {children && <div className="ms-alert-text">{children}</div>}
      </div>
      {action && <div className="ms-alert-action">{action}</div>}
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <div className="ms-loading" role="status">
      <span className="ms-spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, children }) {
  return (
    <div className="ms-empty">
      {icon && <div className="ms-empty-icon">{icon}</div>}
      <p className="ms-empty-title">{title}</p>
      {children && <div className="ms-empty-text">{children}</div>}
    </div>
  );
}

/** 회원가입 단계 표시 (STEP 01 약관동의 › STEP 02 … ) */
export function StepIndicator({ steps, current }) {
  return (
    <ol className="ms-steps" aria-label="진행 단계">
      {steps.map((label, index) => {
        const n = index + 1;
        const state = n < current ? 'done' : n === current ? 'active' : 'todo';
        return (
          <li key={label} className={cx('ms-step', `is-${state}`)} aria-current={state === 'active' ? 'step' : undefined}>
            <span className="ms-step-dot">
              {state === 'done' ? <CheckIcon size={15} strokeWidth={2.6} /> : String(n).padStart(2, '0')}
            </span>
            <span className="ms-step-text">
              <span className="ms-step-no">STEP {String(n).padStart(2, '0')}</span>
              <span className="ms-step-label">{label}</span>
            </span>
            {n < steps.length && <ChevronRightIcon size={16} className="ms-step-arrow" />}
          </li>
        );
      })}
    </ol>
  );
}

/** 계좌번호 복사 버튼 (기부금후원 페이지와 같은 동작) */
export function CopyButton({ text, label = '계좌 복사', className }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const t = document.createElement('textarea');
        t.value = text;
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
      }
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 복사 실패 시 조용히 무시 */
    }
  };

  return (
    <button type="button" className={cx('ms-copy-btn', copied && 'is-copied', className)} onClick={copy} aria-live="polite">
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? '복사됨' : label}
    </button>
  );
}

/** 계좌 안내 박스 */
export function BankAccountBox({ bankName, accountNumber, holder, amount }) {
  return (
    <div className="ms-account">
      <span className="ms-account-bank">{bankName}</span>
      <span className="ms-account-number">{accountNumber}</span>
      <span className="ms-account-holder">/ 예금주: {holder}</span>
      {amount && <span className="ms-account-amount">{amount}</span>}
      <CopyButton text={accountNumber} className="ms-account-copy" />
    </div>
  );
}

/** 확인 창 (입금확인 · 결제취소 · 탈퇴처럼 되돌리기 어려운 동작 전) */
export function ConfirmDialog({ open, title, children, confirmLabel = '확인', cancelLabel = '취소', tone = 'primary', busy, onConfirm, onCancel }) {
  const titleId = useId();
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    confirmRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel?.();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="ms-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel?.()}>
      <div className="ms-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="ms-dialog-title">{title}</h2>
        <div className="ms-dialog-body">{children}</div>
        <div className="ms-dialog-actions">
          <Button variant="outline" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button variant={tone} onClick={onConfirm} loading={busy} ref={confirmRef}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

/** 표: 모바일에서는 각 행이 카드 형태로 바뀝니다 (td 의 data-label 사용) */
export function DataTable({ columns, rows, rowKey, empty = '내역이 없습니다.' }) {
  if (!rows?.length) return <EmptyState title={empty} />;
  return (
    <div className="ms-table-wrap">
      <table className="ms-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={c.width ? { width: c.width } : undefined} className={c.align ? `is-${c.align}` : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row) : i}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} className={c.align ? `is-${c.align}` : undefined}>
                  {c.render ? c.render(row) : row[c.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  return (
    <nav className="ms-pagination" aria-label="페이지">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="이전 페이지">‹</button>
      {nums.map((n) => (
        <button key={n} type="button" className={n === page ? 'is-current' : ''} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="다음 페이지">›</button>
    </nav>
  );
}

/** 서버 검증 오류(fields)를 화면 필드 이름에 맞춰 꺼내 쓰기 */
export const fieldError = (error, name) => error?.fields?.[name];
