// src/components/pages/PasswordResetPage.jsx — 비밀번호 찾기(메일 요청) / 재설정(메일 링크 ?token=)
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Alert, Button, ButtonLink, Card, Checkbox, FormRow, MemberPage, MemberPageHeader, PasswordInput } from '../member/MemberUI';
import { CheckIcon, MailIcon } from '../member/icons';
import { isEmail, isPasswordValid } from '../member/membership';
import { PRIVACY_CONSENT, TERMS_OF_SERVICE } from '../member/terms';

function RequestForm({ initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState({ busy: false, done: false, error: null });

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setState({ busy: false, done: false, error: '가입하신 이메일 주소를 정확히 입력해 주세요.' });
      return;
    }
    setState({ busy: true, done: false, error: null });
    try {
      await api.post('/api/auth/password/forgot', { email: email.trim() });
      setState({ busy: false, done: true, error: null });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message });
    }
  };

  if (state.done) {
    return (
      <Card>
        <div className="ms-result">
          <div className="ms-result-icon"><MailIcon size={26} /></div>
          <h2 className="ms-result-title">메일을 확인해 주세요</h2>
          <p className="ms-result-text">
            <b className="ms-strong">{email}</b>(으)로 가입된 계정이 있다면 비밀번호 재설정 링크를 보냈습니다.
            <br />
            링크는 30분 동안 유효합니다. 메일이 보이지 않으면 스팸함도 확인해 주세요.
          </p>
        </div>
        <div className="ms-actions is-plain">
          <ButtonLink to="/login" variant="outline">로그인으로 돌아가기</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        {state.error && <Alert tone="danger" className="ms-form-alert">{state.error}</Alert>}
        <div className="ms-login-field">
          <label className="ms-label" htmlFor="reset-email">가입한 아이디 (이메일)</label>
          <input id="reset-email" type="email" className="ms-input" placeholder="example@srmq.or.kr" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <p className="ms-hint">입력한 이메일로 비밀번호를 설정할 수 있는 링크를 보내드립니다. 회원명부로 등록된 회원도 여기서 처음 비밀번호를 만듭니다.</p>
        </div>
        <div style={{ marginTop: 20 }}>
          <Button type="submit" block size="lg" loading={state.busy}>재설정 메일 받기</Button>
        </div>
      </form>
      <div className="ms-login-links">
        <Link to="/login" className="ms-link ms-link-muted">로그인</Link>
        <span aria-hidden="true">|</span>
        <Link to="/signup" className="ms-link ms-link-muted">회원가입</Link>
      </div>
    </Card>
  );
}

function ResetForm({ token }) {
  const [form, setForm] = useState({ password: '', passwordConfirm: '' });
  const [state, setState] = useState({ busy: false, done: false, error: null, fields: {} });
  // 회원명부로 등록된 회원은 처음 비밀번호를 만들 때 약관 동의가 필요합니다 (서버가 CONSENT_REQUIRED 로 알려 줌)
  const [needsConsent, setNeedsConsent] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false });
  const [openTerm, setOpenTerm] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const fields = {};
    if (!isPasswordValid(form.password)) fields.password = '영문, 숫자, 특수문자를 포함해 8~16자로 입력해 주세요.';
    if (form.password !== form.passwordConfirm) fields.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (Object.keys(fields).length) {
      setState({ busy: false, done: false, error: null, fields });
      return;
    }
    if (needsConsent && !(agree.terms && agree.privacy)) {
      setState({
        busy: false,
        done: false,
        error: null,
        fields: {
          ...(agree.terms ? {} : { 'agreements.terms': '이용약관에 동의해 주세요.' }),
          ...(agree.privacy ? {} : { 'agreements.privacy': '개인정보 수집 및 이용에 동의해 주세요.' }),
        },
      });
      return;
    }
    setState({ busy: true, done: false, error: null, fields: {} });
    try {
      await api.post('/api/auth/password/reset', { token, ...form, ...(needsConsent ? { agreements: agree } : {}) });
      setState({ busy: false, done: true, error: null, fields: {} });
    } catch (err) {
      if (err.code === 'CONSENT_REQUIRED') {
        setNeedsConsent(true);
        setState({ busy: false, done: false, error: null, fields: {} });
        return;
      }
      setState({ busy: false, done: false, error: err.message, fields: err.fields || {} });
    }
  };

  if (state.done) {
    return (
      <Card>
        <div className="ms-result">
          <div className="ms-result-icon"><CheckIcon size={28} strokeWidth={2.6} /></div>
          <h2 className="ms-result-title">{needsConsent ? '비밀번호를 만들었습니다' : '비밀번호가 변경되었습니다'}</h2>
          <p className="ms-result-text">
            {needsConsent
              ? '이제 이 이메일과 새 비밀번호로 로그인하면 기존 회원 자격을 그대로 이용할 수 있습니다.'
              : '보안을 위해 다른 기기의 로그인은 모두 해제되었습니다. 새 비밀번호로 로그인해 주세요.'}
          </p>
        </div>
        <div className="ms-actions is-plain">
          <ButtonLink to="/login">로그인하기</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        {state.error && (
          <Alert tone="danger" className="ms-form-alert" action={<Link to="/password-reset" className="ms-link">다시 요청</Link>}>
            {state.error}
          </Alert>
        )}
        <FormRow label="새 비밀번호" required htmlFor="np" error={state.fields.password} hint="영문, 숫자, 특수문자를 포함해 8~16자" ok={isPasswordValid(form.password)}>
          <PasswordInput id="np" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormRow>
        <FormRow label="새 비밀번호 확인" required htmlFor="np2" error={state.fields.passwordConfirm}>
          <PasswordInput id="np2" autoComplete="new-password" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} />
        </FormRow>
        {needsConsent && (
          <div className="ms-stack" style={{ marginTop: 16 }}>
            <Alert tone="info" title="처음 이용하시는군요">
              회원명부로 등록된 회원은 홈페이지를 처음 이용할 때 아래 약관에 동의해 주셔야 합니다.
            </Alert>
            <div className="ms-agree">
              {[
                { key: 'terms', label: '사경원 이용약관 동의', text: TERMS_OF_SERVICE },
                { key: 'privacy', label: '개인정보 수집 및 이용 동의', text: PRIVACY_CONSENT },
              ].map((t) => (
                <div key={t.key}>
                  <div className="ms-agree-row">
                    <Checkbox checked={agree[t.key]} onChange={(v) => setAgree((a) => ({ ...a, [t.key]: v }))}>
                      <span><span className="ms-tag-req">[필수]</span> {t.label}</span>
                    </Checkbox>
                    <button type="button" className="ms-agree-link" onClick={() => setOpenTerm(openTerm === t.key ? null : t.key)}>전문보기</button>
                  </div>
                  {openTerm === t.key && <div className="ms-terms-box" tabIndex={0}>{t.text}</div>}
                  {state.fields[`agreements.${t.key}`] && <p className="ms-error">{state.fields[`agreements.${t.key}`]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <Button type="submit" block size="lg" loading={state.busy}>{needsConsent ? '동의하고 비밀번호 만들기' : '비밀번호 변경'}</Button>
        </div>
      </form>
    </Card>
  );
}

export default function PasswordResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  return (
    <MemberPage width="narrow">
      <MemberPageHeader
        badge="회원서비스"
        badgeEn="PASSWORD RESET"
        title={token ? '새 비밀번호 설정' : '비밀번호 찾기'}
        desc={token ? '새로 사용할 비밀번호를 입력해 주세요.' : '가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.'}
      />
      {token ? <ResetForm token={token} /> : <RequestForm initialEmail={params.get('email') || ''} />}
    </MemberPage>
  );
}
