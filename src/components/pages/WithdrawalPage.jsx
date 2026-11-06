// src/components/pages/WithdrawalPage.jsx — 회원탈퇴 (탈퇴 전 유의사항 · 본인 확인 및 탈퇴 사유)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  ConfirmDialog,
  FormRow,
  MemberPage,
  MemberPageHeader,
  PasswordInput,
} from '../member/MemberUI';
import { AlertIcon, CheckIcon, UserMinusIcon } from '../member/icons';
import { MEMBERSHIP_STATUS, WITHDRAW_REASONS } from '../member/membership';

const MAX_FEEDBACK = 500;

export default function WithdrawalPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('LOW_USAGE');
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <MemberPage>
        <MemberPageHeader badge="회원서비스" badgeEn="ACCOUNT WITHDRAWAL" title="회원탈퇴" />
        <Card>
          <div className="ms-result">
            <div className="ms-result-icon"><CheckIcon size={28} strokeWidth={2.6} /></div>
            <h2 className="ms-result-title">회원탈퇴가 완료되었습니다</h2>
            <p className="ms-result-text">그동안 사회적책임경영품질원을 이용해 주셔서 감사합니다.<br />보내 주신 의견은 서비스 개선에 소중히 반영하겠습니다.</p>
          </div>
          <div className="ms-actions is-plain">
            <ButtonLink to="/" variant="outline">첫 화면으로</ButtonLink>
          </div>
        </Card>
      </MemberPage>
    );
  }

  if (!user) return null;
  const plan = user.membership.plan;
  const statusLabel = MEMBERSHIP_STATUS[user.membership.status]?.label;
  const accountBadge = plan && user.membership.status === 'ACTIVE' ? `${plan.name} 인증계정` : statusLabel;

  const openConfirm = () => {
    const e = {};
    if (!agreed) e.agreed = '탈퇴 전 유의사항을 확인하고 동의해 주세요.';
    if (!password) e.password = '현재 로그인된 비밀번호를 입력해 주세요.';
    if (!reason) e.reason = '탈퇴 사유를 선택해 주세요.';
    setErrors(e);
    setFormError(Object.keys(e).length ? Object.values(e)[0] : null);
    if (!Object.keys(e).length) setConfirming(true);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/api/me/withdraw', { password, reason, feedback: feedback.trim() || null, agreed });
      setConfirming(false);
      setDone(true);
      setUser(null);
    } catch (err) {
      setConfirming(false);
      setErrors(err.fields || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <MemberPage>
      <MemberPageHeader
        badge="회원서비스"
        badgeEn="ACCOUNT WITHDRAWAL"
        title="회원탈퇴"
        desc="사회적책임경영품질원 회원 탈퇴 전 유의사항을 반드시 확인해 주시기 바랍니다."
      />

      <Card title={<><AlertIcon size={17} /> 탈퇴 전 유의사항</>}>
        <div className="ms-withdraw-notice">
          <p>탈퇴 시 보유 중인 회원 <b>등급(정회원/기업회원)</b> 및 <b>자격 혜택</b>이 즉시 상실되며 복구되지 않습니다.</p>
          <p>납부한 회비는 탈퇴로 환불되지 않으며, 신청 중인 교육 과정 및 이미 발급된 <b>수료증/자격증 내역</b> 조회가 영구적으로 제한될 수 있습니다.</p>
          <p>기부금 영수증 및 회비 결제 관련 법정 보존 의무 데이터는 관련 법령(<b>국세기본법, 전자상거래법</b> 등)에 따라 일정 기간 안전하게 분리 보관 후 파기됩니다.</p>
          <p>무분별한 재가입 방지 및 부정 이용 방지를 위해 <span className="ms-red ms-strong">동일한 이메일/아이디로는 탈퇴 후 30일간 재가입이 불가</span>합니다.</p>
        </div>
        <div className={`ms-withdraw-agree${errors.agreed ? ' has-error' : ''}`}>
          <Checkbox checked={agreed} onChange={setAgreed}>
            <span className="ms-strong">위 유의사항을 모두 확인하였으며, 이에 동의합니다. <span className="ms-red">(필수)</span></span>
          </Checkbox>
          <span className="ms-agree-side">약관 검토 완료 필요</span>
        </div>
      </Card>

      <Card title="본인 확인 및 탈퇴 사유 입력">
        {formError && <Alert tone="danger" className="ms-form-alert">{formError}</Alert>}

        <FormRow label="아이디 (이메일)">
          <div className="ms-input-wrap">
            <input className="ms-input" value={user.email} readOnly style={{ paddingRight: 130 }} />
            <span className="ms-input-badge">
              <Badge tone={user.membership.status === 'ACTIVE' ? 'sky' : 'slate'}>{accountBadge}</Badge>
            </span>
          </div>
        </FormRow>
        <FormRow label="비밀번호 확인" required htmlFor="wd-pw" error={errors.password} hint="개인정보 보안을 위해 본인 확인 절차가 진행됩니다.">
          <PasswordInput id="wd-pw" placeholder="현재 로그인된 비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormRow>
        <FormRow label="탈퇴 사유 선택" required error={errors.reason}>
          <div className="ms-radio-list" role="radiogroup" aria-label="탈퇴 사유">
            {WITHDRAW_REASONS.map((r) => (
              <label key={r.value} className={`ms-radio${reason === r.value ? ' is-checked' : ''}`}>
                <input type="radio" name="withdraw-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                {r.label}
              </label>
            ))}
          </div>
        </FormRow>
        <FormRow label="개선 의견 및 바라는 점" sub="(선택 사항)" htmlFor="wd-fb" error={errors.feedback}>
          <textarea
            id="wd-fb"
            className="ms-textarea"
            maxLength={MAX_FEEDBACK}
            placeholder="사경원 서비스 발전을 위한 솔직한 의견을 남겨주시면 연구 및 교육 운영에 적극 반영하겠습니다."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="ms-counter">
            <span>최대 500자 이내</span>
            <span>{feedback.length} / {MAX_FEEDBACK}</span>
          </div>
        </FormRow>

        <div className="ms-actions is-end">
          <Button variant="outline" onClick={() => navigate('/mypage')}>탈퇴 취소 (마이페이지로)</Button>
          <Button variant="danger" icon={<UserMinusIcon size={16} />} onClick={openConfirm}>회원탈퇴 신청</Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="정말 탈퇴하시겠습니까?"
        confirmLabel="탈퇴하기"
        tone="danger"
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={submit}
      >
        탈퇴하면 {plan ? `${plan.name} ` : ''}회원 자격과 혜택이 즉시 사라지며 되돌릴 수 없습니다.
        같은 이메일로는 30일 동안 다시 가입할 수 없습니다.
      </ConfirmDialog>
    </MemberPage>
  );
}
