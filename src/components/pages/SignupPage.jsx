// src/components/pages/SignupPage.jsx — 회원가입 (STEP 01 약관동의 → 02 회원유형 선택 → 03 정보입력 → 04 가입완료)
// 가입이 끝나면 자동 로그인되며, 04 단계에서 바로 회비 결제(/membership/checkout) 또는 마이페이지로 이동합니다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { groupPlans, planFeeText, useMembershipPlans } from '../../hooks/useMembershipPlans';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  FormRow,
  MemberPage,
  MemberPageHeader,
  PasswordInput,
  PlanBadge,
  SectionTitle,
  Spinner,
  StepIndicator,
} from '../member/MemberUI';
import { ArrowLeftIcon, ArrowRightIcon, BuildingIcon, CheckIcon, UserIcon } from '../member/icons';
import {
  CATEGORY_LABEL,
  checkPassword,
  digitsOnly,
  formatBizNoInput,
  formatPhoneInput,
  formatWon,
  isEmail,
  isPasswordValid,
} from '../member/membership';
import { MARKETING_CONSENT, PRIVACY_CONSENT, TERMS_OF_SERVICE } from '../member/terms';

const STEPS = ['약관동의', '회원유형 선택', '정보입력', '가입완료'];

const EMPTY_FORM = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  affiliation: '',
  department: '',
  position: '',
  phone: '',
  officePhone: '',
  companyName: '',
  businessNo: '',
  ceoName: '',
  taxEmail: '',
};

const TERM_BADGE = { ANNUAL: '매년 연회비', PERMANENT: '1회 납부', LIFETIME: '평생 회원' };

/** 탭(회원구분)마다 고를 수 있는 등급 */
const plansForType = (plans, memberType) =>
  plans.filter((p) =>
    memberType === 'INDIVIDUAL'
      ? p.category === 'GENERAL'
      : p.category !== 'GENERAL' || p.memberType === 'ANY',
  );

function validate(form, { memberType, planCode, agree }) {
  const e = {};
  if (!isEmail(form.email)) e.email = '올바른 이메일 주소를 입력해 주세요.';
  if (!isPasswordValid(form.password)) e.password = '영문, 숫자, 특수문자를 포함해 8~16자로 입력해 주세요.';
  if (!form.passwordConfirm) e.passwordConfirm = '비밀번호를 한 번 더 입력해 주세요.';
  else if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  if (form.name.trim().length < 2) e.name = memberType === 'ORGANIZATION' ? '담당자 성명을 입력해 주세요.' : '성명을 입력해 주세요.';
  if (!/^01[016789]\d{7,8}$/.test(digitsOnly(form.phone))) e.phone = '휴대전화 번호를 정확히 입력해 주세요.';
  if (form.officePhone && !/^\d{8,12}$/.test(digitsOnly(form.officePhone))) e.officePhone = '전화번호 형식이 올바르지 않습니다.';
  if (memberType === 'INDIVIDUAL' && !form.affiliation.trim()) e.affiliation = "소속을 입력해 주세요. (무소속이면 '개인')";
  if (memberType === 'ORGANIZATION') {
    if (!form.companyName.trim()) e.companyName = '기업명을 입력해 주세요.';
    if (digitsOnly(form.businessNo).length !== 10) e.businessNo = '사업자등록번호 10자리를 입력해 주세요.';
    if (form.taxEmail && !isEmail(form.taxEmail)) e.taxEmail = '이메일 형식이 올바르지 않습니다.';
  }
  if (!planCode) e.planCode = '회원 유형을 선택해 주세요.';
  if (!agree.terms) e['agreements.terms'] = '사경원 이용약관에 동의해 주세요.';
  if (!agree.privacy) e['agreements.privacy'] = '개인정보 수집 및 이용에 동의해 주세요.';
  return e;
}

export default function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { plans, error: plansError } = useMembershipPlans();
  const topRef = useRef(null);

  const [step, setStep] = useState(1);
  const [agree, setAgree] = useState({ terms: false, privacy: false, sms: false, marketing: false });
  const [openTerm, setOpenTerm] = useState(null);
  const [planCode, setPlanCode] = useState(params.get('plan') || '');
  const [memberType, setMemberType] = useState('INDIVIDUAL');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [emailCheck, setEmailCheck] = useState({ state: 'idle', email: '' }); // idle | checking | ok | taken
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [quote, setQuote] = useState(null);

  const grouped = useMemo(() => groupPlans(plans || []), [plans]);
  const selectedPlan = plans?.find((p) => p.code === planCode) || null;
  const pwCheck = checkPassword(form.password);
  const allAgreed = agree.terms && agree.privacy && agree.sms && agree.marketing;

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  // 등급을 고르면 그 등급에 맞는 입력 양식(개인/기업)으로 맞춥니다.
  const choosePlan = (plan) => {
    setPlanCode(plan.code);
    if (plan.memberType === 'ORGANIZATION') setMemberType('ORGANIZATION');
    if (plan.memberType === 'INDIVIDUAL') setMemberType('INDIVIDUAL');
    setErrors((e) => ({ ...e, planCode: undefined }));
  };

  const switchType = (type) => {
    setMemberType(type);
    if (selectedPlan && !plansForType(plans, type).some((p) => p.code === selectedPlan.code)) setPlanCode('');
  };

  const set = (key) => (e) => {
    let value = e.target.value;
    if (key === 'phone' || key === 'officePhone') value = formatPhoneInput(value);
    if (key === 'businessNo') value = formatBizNoInput(value);
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
    if (key === 'email' && emailCheck.state !== 'idle') setEmailCheck({ state: 'idle', email: '' });
  };

  async function checkEmail() {
    const email = form.email.trim().toLowerCase();
    if (!isEmail(email)) {
      setErrors((x) => ({ ...x, email: '올바른 이메일 주소를 입력해 주세요.' }));
      return false;
    }
    setEmailCheck({ state: 'checking', email });
    try {
      const { available, imported } = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      setEmailCheck({ state: available ? 'ok' : imported ? 'imported' : 'taken', email });
      setErrors((x) => ({
        ...x,
        email: available
          ? undefined
          : imported
            ? '회원명부에 이미 등록된 이메일입니다. 새로 가입하지 말고 아래에서 비밀번호만 만들어 주세요.'
            : '이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요.',
      }));
      return available;
    } catch (err) {
      setEmailCheck({ state: 'idle', email: '' });
      setErrors((x) => ({ ...x, email: err.message }));
      return false;
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const found = validate(form, { memberType, planCode, agree });
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('입력 내용을 다시 확인해 주세요.');
      return;
    }
    const email = form.email.trim().toLowerCase();
    if (!(emailCheck.state === 'ok' && emailCheck.email === email) && !(await checkEmail())) return;

    setSubmitting(true);
    try {
      const isOrg = memberType === 'ORGANIZATION';
      const signedUp = await signup({
        email,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        memberType,
        planCode,
        name: form.name.trim(),
        phone: form.phone,
        officePhone: form.officePhone || null,
        affiliation: isOrg ? form.companyName.trim() : form.affiliation.trim(),
        department: form.department.trim() || null,
        position: form.position.trim() || null,
        companyName: isOrg ? form.companyName.trim() : null,
        businessNo: isOrg ? form.businessNo : null,
        ceoName: isOrg ? form.ceoName.trim() || null : null,
        taxEmail: isOrg ? form.taxEmail.trim() || null : null,
        agreements: agree,
      });
      setCreated(signedUp);
      api.get(`/api/plans/${planCode}/quote`).then((d) => setQuote(d.quote)).catch(() => {});
      setStep(4);
    } catch (err) {
      setErrors(err.fields || {});
      if (err.code === 'EMAIL_TAKEN') setEmailCheck({ state: 'taken', email });
      if (err.code === 'IMPORTED_MEMBER') setEmailCheck({ state: 'imported', email });
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- */

  if (user && !created) {
    return (
      <MemberPage width="narrow">
        <MemberPageHeader badge="회원서비스" badgeEn="MEMBERSHIP JOIN" title="회원가입" />
        <Card>
          <div className="ms-result">
            <div className="ms-result-icon"><UserIcon size={26} /></div>
            <h2 className="ms-result-title">이미 로그인되어 있습니다</h2>
            <p className="ms-result-text">{user.name}님은 이미 사경원 회원입니다. 회원 정보와 회비 납부는 마이페이지에서 확인하세요.</p>
          </div>
          <div className="ms-actions is-plain">
            <ButtonLink to="/mypage" iconRight={<ArrowRightIcon size={15} />}>마이페이지로 이동</ButtonLink>
          </div>
        </Card>
      </MemberPage>
    );
  }

  const renderPlanCard = (plan) => {
    const selected = plan.code === planCode;
    return (
      <button
        key={plan.code}
        type="button"
        className={`ms-plan-card${selected ? ' is-selected' : ''}`}
        onClick={() => choosePlan(plan)}
        aria-pressed={selected}
      >
        <span className="ms-plan-card-check"><CheckIcon size={13} strokeWidth={3} /></span>
        <span className="ms-plan-card-head">
          <span className="ms-plan-card-name">{plan.name}</span>
          {plan.category === 'GENERAL' ? (
            <span className="ms-badge ms-badge--lime">{TERM_BADGE[plan.term]}</span>
          ) : (
            <PlanBadge plan={plan} />
          )}
        </span>
        <span className="ms-plan-card-fee">
          {formatWon(plan.joinFee + plan.annualFee)}
          <small>{planFeeText(plan)}</small>
        </span>
        <ul className="ms-plan-benefits">
          {plan.benefits.slice(0, 4).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </button>
    );
  };

  return (
    <MemberPage>
      <div ref={topRef} className="ms-scroll-anchor" />
      <MemberPageHeader
        badge="회원서비스"
        badgeEn="MEMBERSHIP JOIN"
        title="회원가입"
        desc="사단법인 사회적책임경영품질원의 회원으로 가입하시고 다양한 혜택과 전문 서비스를 받아보세요."
      />

      <StepIndicator steps={STEPS} current={step} />

      {/* ───────────── STEP 01 약관동의 ───────────── */}
      {step === 1 && (
        <Card title="약관 동의" aside={<span><span className="ms-req">*</span> 필수 동의 항목</span>}>
          <div className="ms-agree">
            <Checkbox
              className="ms-agree-all"
              checked={allAgreed}
              onChange={(v) => setAgree({ terms: v, privacy: v, sms: v, marketing: v })}
              sub="선택 항목(뉴스레터 · 문자 수신)까지 한 번에 동의합니다."
            >
              아래 약관 및 정보 수신에 모두 동의합니다.
            </Checkbox>

            {[
              { key: 'terms', tag: '필수', label: '사경원 이용약관 동의', text: TERMS_OF_SERVICE },
              { key: 'privacy', tag: '필수', label: '개인정보 수집 및 이용 동의', text: PRIVACY_CONSENT },
              { key: 'marketing', tag: '선택', label: 'SRMQ 뉴스레터 및 ESG 정책 포럼 · 세미나 행사 안내 수신 동의', text: MARKETING_CONSENT },
            ].map((t) => (
              <div key={t.key}>
                <div className="ms-agree-row">
                  <Checkbox checked={agree[t.key]} onChange={(v) => setAgree((a) => ({ ...a, [t.key]: v }))}>
                    <span>
                      <span className={t.tag === '필수' ? 'ms-tag-req' : 'ms-tag-opt'}>[{t.tag}]</span> {t.label}
                    </span>
                  </Checkbox>
                  <button type="button" className="ms-agree-link" onClick={() => setOpenTerm(openTerm === t.key ? null : t.key)}>
                    {openTerm === t.key ? '접기' : '전문보기'}
                  </button>
                </div>
                {openTerm === t.key && <div className="ms-terms-box" tabIndex={0}>{t.text}</div>}
              </div>
            ))}
            <div className="ms-agree-row">
              <Checkbox checked={agree.sms} onChange={(v) => setAgree((a) => ({ ...a, sms: v }))}>
                <span><span className="ms-tag-opt">[선택]</span> 교육 일정 및 심사 안내 SMS · 알림톡 수신 동의</span>
              </Checkbox>
              <span className="ms-agree-side">문자</span>
            </div>
          </div>

          <div className="ms-actions">
            <Button variant="outline" onClick={() => navigate('/members')}>회원 안내 보기</Button>
            <Button onClick={() => setStep(2)} disabled={!agree.terms || !agree.privacy} iconRight={<ArrowRightIcon size={15} />}>
              다음 단계
            </Button>
          </div>
        </Card>
      )}

      {/* ───────────── STEP 02 회원유형 선택 ───────────── */}
      {step === 2 && (
        <Card title="회원 유형 선택" aside="가입 후 회비를 납부하면 회원 자격이 시작됩니다.">
          {plansError && <Alert tone="danger">회원 유형을 불러오지 못했습니다. {plansError.message}</Alert>}
          {!plans && !plansError && <Spinner label="회원 유형을 불러오는 중입니다" />}
          {plans &&
            ['GENERAL', 'CORPORATE', 'SPECIAL'].map((cat) => (
              <div className="ms-plan-group" key={cat}>
                <h3 className="ms-plan-group-title">
                  {CATEGORY_LABEL[cat]}
                  <small>
                    {cat === 'GENERAL' && '개인 · 단체 (총회 의결권은 정회원 · 준회원)'}
                    {cat === 'CORPORATE' && '기업 · 기관 (연회비)'}
                    {cat === 'SPECIAL' && '글로벌 ESG 혜택 + 후원금 사용용도 지정'}
                  </small>
                </h3>
                <div className="ms-plan-grid">{grouped[cat].map(renderPlanCard)}</div>
              </div>
            ))}

          <div className="ms-actions">
            <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeftIcon size={15} />}>이전</Button>
            <Button onClick={() => setStep(3)} disabled={!planCode} iconRight={<ArrowRightIcon size={15} />}>
              {selectedPlan ? `${selectedPlan.name}(으)로 계속` : '회원 유형을 선택하세요'}
            </Button>
          </div>
        </Card>
      )}

      {/* ───────────── STEP 03 정보입력 ───────────── */}
      {step === 3 && plans && (
        <form onSubmit={onSubmit} noValidate className="ms-stack" style={{ gap: 20 }}>
          <div className="ms-segment-wrap">
            <div className="ms-segment" role="tablist" aria-label="회원 구분">
              <button type="button" role="tab" aria-selected={memberType === 'INDIVIDUAL'} className={memberType === 'INDIVIDUAL' ? 'is-active' : ''} onClick={() => switchType('INDIVIDUAL')}>
                <UserIcon size={16} /> 일반회원 (개인/준회원/정회원)
              </button>
              <button type="button" role="tab" aria-selected={memberType === 'ORGANIZATION'} className={memberType === 'ORGANIZATION' ? 'is-active' : ''} onClick={() => switchType('ORGANIZATION')}>
                <BuildingIcon size={16} /> 기업회원 (내셔널/베스트/글로벌 ESG)
              </button>
            </div>
          </div>

          <Card>
            {formError && <Alert tone="danger" className="ms-form-alert">{formError}</Alert>}

            <SectionTitle aside={<span><span className="ms-req">*</span> 필수 입력 항목</span>}>계정 기본 정보</SectionTitle>
            <FormRow label="회원 유형" required error={errors.planCode}>
              <div className="ms-chip-list">
                {plansForType(plans, memberType).map((p) => (
                  <button key={p.code} type="button" className={`ms-chip${p.code === planCode ? ' is-selected' : ''}`} onClick={() => choosePlan(p)}>
                    {p.code === planCode && <CheckIcon size={13} strokeWidth={3} />}
                    {p.name} <small>{formatWon(p.joinFee + p.annualFee)}</small>
                  </button>
                ))}
              </div>
            </FormRow>
            <FormRow
              label="아이디 (이메일)"
              required
              htmlFor="su-email"
              error={errors.email}
              ok={emailCheck.state === 'ok'}
              hint={emailCheck.state === 'ok' ? '사용할 수 있는 이메일입니다.' : '기관 공지 및 교육 안내, 인증서 발급에 사용되는 기본 이메일 계정입니다.'}
            >
              <div className="ms-input-group">
                <input id="su-email" type="email" className="ms-input" placeholder="example@srmq.or.kr" autoComplete="email" value={form.email} onChange={set('email')} />
                <Button variant="outline" onClick={checkEmail} loading={emailCheck.state === 'checking'}>중복확인</Button>
              </div>
            </FormRow>
            {emailCheck.state === 'imported' && (
              <Alert
                tone="info"
                title="이미 사경원 회원이십니다"
                action={<ButtonLink to={`/password-reset?email=${encodeURIComponent(emailCheck.email)}`} size="sm">비밀번호 만들기</ButtonLink>}
              >
                회원명부로 미리 등록된 이메일입니다. 비밀번호만 만들면 기존 회원 자격 그대로 로그인할 수 있습니다.
              </Alert>
            )}
            <FormRow
              label="비밀번호"
              required
              htmlFor="su-pw"
              error={errors.password}
              ok={form.password && isPasswordValid(form.password)}
              hint="영문 대소문자, 숫자, 특수문자(!@#$%^&*)를 포함하여 8~16자로 입력하세요."
            >
              <div className="ms-w-md">
                <PasswordInput id="su-pw" placeholder="영문, 숫자, 특수문자 조합 8~16자리" autoComplete="new-password" value={form.password} onChange={set('password')} />
              </div>
              {form.password && !isPasswordValid(form.password) && (
                <p className="ms-hint">
                  {[['length', '8~16자'], ['letter', '영문'], ['digit', '숫자'], ['special', '특수문자']].map(([k, label]) => (
                    <span key={k} className={pwCheck[k] ? 'ms-green' : ''} style={{ marginRight: 8 }}>
                      {pwCheck[k] ? '✓' : '·'} {label}
                    </span>
                  ))}
                </p>
              )}
            </FormRow>
            <FormRow label="비밀번호 확인" required htmlFor="su-pw2" error={errors.passwordConfirm}>
              <div className="ms-w-md">
                <PasswordInput id="su-pw2" placeholder="비밀번호를 다시 한 번 입력하세요" autoComplete="new-password" value={form.passwordConfirm} onChange={set('passwordConfirm')} />
              </div>
            </FormRow>

            <hr className="ms-divider" />

            {memberType === 'INDIVIDUAL' ? (
              <>
                <SectionTitle>소속 및 담당자 정보</SectionTitle>
                <FormRow label="성명 (실명)" required htmlFor="su-name" error={errors.name}>
                  <input id="su-name" className="ms-input ms-w-md" placeholder="홍길동" autoComplete="name" value={form.name} onChange={set('name')} />
                </FormRow>
                <FormRow label="소속 기관 / 기업명" required htmlFor="su-aff" error={errors.affiliation} hint="개인 프리랜서 또는 무소속일 경우 '개인'으로 기재 가능합니다.">
                  <input id="su-aff" className="ms-input" placeholder="(주)한국사회적책임 / 서울대학교" autoComplete="organization" value={form.affiliation} onChange={set('affiliation')} />
                </FormRow>
              </>
            ) : (
              <>
                <SectionTitle>기업 정보</SectionTitle>
                <FormRow label="기업명" required htmlFor="su-company" error={errors.companyName}>
                  <input id="su-company" className="ms-input" placeholder="(주)한국사회적책임" autoComplete="organization" value={form.companyName} onChange={set('companyName')} />
                </FormRow>
                <FormRow label="사업자등록번호" required htmlFor="su-biz" error={errors.businessNo} hint="세금계산서 · 영수증 발급에 사용됩니다.">
                  <input id="su-biz" className="ms-input ms-w-sm" inputMode="numeric" placeholder="000-00-00000" value={form.businessNo} onChange={set('businessNo')} />
                </FormRow>
                <FormRow label="대표자명" htmlFor="su-ceo">
                  <input id="su-ceo" className="ms-input ms-w-sm" placeholder="대표자 성명" value={form.ceoName} onChange={set('ceoName')} />
                </FormRow>
                <FormRow label="세금계산서 수신 이메일" htmlFor="su-tax" error={errors.taxEmail}>
                  <input id="su-tax" type="email" className="ms-input ms-w-md" placeholder="tax@company.co.kr" value={form.taxEmail} onChange={set('taxEmail')} />
                </FormRow>
                <hr className="ms-divider" />
                <SectionTitle>담당자 정보</SectionTitle>
                <FormRow label="담당자 성명" required htmlFor="su-name" error={errors.name}>
                  <input id="su-name" className="ms-input ms-w-md" placeholder="홍길동" autoComplete="name" value={form.name} onChange={set('name')} />
                </FormRow>
              </>
            )}
            <FormRow label="직위 / 부서">
              <div className="ms-input-pair">
                <input className="ms-input" aria-label="부서" placeholder="부서명 (예: ESG경영팀)" value={form.department} onChange={set('department')} />
                <input className="ms-input" aria-label="직위" placeholder="직위/직책 (예: 팀장 / 선임연구원)" value={form.position} onChange={set('position')} />
              </div>
            </FormRow>
            <FormRow label="휴대전화 번호" required htmlFor="su-phone" error={errors.phone}>
              <input id="su-phone" className="ms-input ms-w-md" inputMode="tel" placeholder="010-0000-0000" autoComplete="tel" value={form.phone} onChange={set('phone')} />
              <div style={{ marginTop: 8 }}>
                <Checkbox checked={agree.sms} onChange={(v) => setAgree((a) => ({ ...a, sms: v }))}>
                  <span className="ms-text-sm ms-muted">교육 일정 및 긴급 심사 안내 SMS/알림톡 수신에 동의합니다.</span>
                </Checkbox>
              </div>
            </FormRow>
            <FormRow label="사무실 유선전화" htmlFor="su-office" error={errors.officePhone}>
              <input id="su-office" className="ms-input ms-w-sm" inputMode="tel" placeholder="02-000-0000" value={form.officePhone} onChange={set('officePhone')} />
            </FormRow>

            <hr className="ms-divider" />

            <SectionTitle>수신 동의 및 최종 확인</SectionTitle>
            <div className="ms-agree">
              <Checkbox className="ms-agree-all" checked={allAgreed} onChange={(v) => setAgree({ terms: v, privacy: v, sms: v, marketing: v })} sub="선택 동의 항목에 대해서도 일괄적으로 동의 처리가 진행됩니다.">
                아래 약관 및 마케팅 정보 수신에 모두 동의합니다.
              </Checkbox>
              {[
                { key: 'terms', tag: '필수', label: '사경원 이용약관 동의', side: '전문보기', text: TERMS_OF_SERVICE },
                { key: 'privacy', tag: '필수', label: '개인정보 수집 및 이용 동의', side: '전문보기', text: PRIVACY_CONSENT },
                { key: 'marketing', tag: '선택', label: 'SRMQ 뉴스레터 및 ESG 정책 포럼 · 세미나 행사 안내 수신 동의', side: '이메일/문자', text: MARKETING_CONSENT },
              ].map((t) => (
                <div key={t.key}>
                  <div className="ms-agree-row">
                    <Checkbox checked={agree[t.key]} onChange={(v) => setAgree((a) => ({ ...a, [t.key]: v }))}>
                      <span><span className={t.tag === '필수' ? 'ms-tag-req' : 'ms-tag-opt'}>[{t.tag}]</span> {t.label}</span>
                    </Checkbox>
                    <button type="button" className="ms-agree-link" onClick={() => setOpenTerm(openTerm === `s3-${t.key}` ? null : `s3-${t.key}`)}>
                      {t.side}
                    </button>
                  </div>
                  {openTerm === `s3-${t.key}` && <div className="ms-terms-box" tabIndex={0}>{t.text}</div>}
                  {errors[`agreements.${t.key}`] && <p className="ms-error">{errors[`agreements.${t.key}`]}</p>}
                </div>
              ))}
            </div>

            <div className="ms-actions">
              <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeftIcon size={15} />}>이전</Button>
              <Button type="submit" loading={submitting} iconRight={<ArrowRightIcon size={15} />}>회원가입 완료</Button>
            </div>
          </Card>
        </form>
      )}

      {/* ───────────── STEP 04 가입완료 ───────────── */}
      {step === 4 && created && (
        <Card>
          <div className="ms-result">
            <div className="ms-result-icon"><CheckIcon size={28} strokeWidth={2.6} /></div>
            <h2 className="ms-result-title">회원가입이 완료되었습니다</h2>
            <p className="ms-result-text">
              {created.name}님, 사회적책임경영품질원 회원이 되신 것을 환영합니다.
              <br />
              회비를 납부하시면 <b className="ms-strong">{selectedPlan?.name}</b> 자격과 혜택이 바로 시작됩니다.
            </p>
          </div>

          <dl className="ms-kv" style={{ marginTop: 24 }}>
            <dt>아이디</dt>
            <dd>{created.email}</dd>
            <dt>회원 유형</dt>
            <dd className="ms-row">
              {selectedPlan?.name}
              {selectedPlan && selectedPlan.category !== 'GENERAL' && <PlanBadge plan={selectedPlan} />}
            </dd>
            <dt>납부할 회비</dt>
            <dd>
              {quote ? (
                <>
                  <span className="ms-amount">{formatWon(quote.amount)}</span>{' '}
                  <span className="ms-muted ms-text-sm">({quote.items.map((i) => `${i.label} ${formatWon(i.amount)}`).join(' + ')})</span>
                </>
              ) : (
                selectedPlan && formatWon(selectedPlan.joinFee + selectedPlan.annualFee)
              )}
            </dd>
          </dl>

          <div className="ms-actions">
            <ButtonLink to="/mypage?welcome=1" variant="outline">마이페이지로 이동</ButtonLink>
            <ButtonLink to={`/membership/checkout?plan=${planCode}`} iconRight={<ArrowRightIcon size={15} />}>지금 회비 결제하기</ButtonLink>
          </div>
        </Card>
      )}
    </MemberPage>
  );
}
