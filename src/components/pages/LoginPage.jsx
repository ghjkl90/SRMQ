// src/components/pages/LoginPage.jsx — 로그인 (일반 회원 · 관리자 공통)
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { safeNext } from '../../auth/RouteGuards';
import { Alert, Button, ButtonLink, Card, Checkbox, MemberPage, MemberPageHeader, PasswordInput } from '../member/MemberUI';
import { ArrowRightIcon } from '../member/icons';

export default function LoginPage() {
  const { user, login, status } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), '/mypage');

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(null); // 회원명부로 등록돼 아직 비밀번호가 없는 이메일
  const [submitting, setSubmitting] = useState(false);

  // 이미 로그인한 상태면 바로 이동
  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('아이디(이메일)와 비밀번호를 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setNeedsPassword(null);
    try {
      const loggedIn = await login({ email: form.email.trim(), password: form.password, remember: form.remember });
      navigate(loggedIn.role === 'ADMIN' && next === '/mypage' ? '/admin' : next, { replace: true });
    } catch (err) {
      if (err.code === 'PASSWORD_NOT_SET') setNeedsPassword(form.email.trim());
      else setError(err.message);
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberPage width="narrow">
      <MemberPageHeader
        badge="회원서비스"
        badgeEn="MEMBER LOGIN"
        title="로그인"
        desc="사경원 회원 아이디(이메일)와 비밀번호로 로그인해 주세요."
      />

      <Card>
        <form onSubmit={onSubmit} noValidate>
          {(status === 'offline' || error || needsPassword) && (
            <div className="ms-stack" style={{ marginBottom: 16 }}>
              {status === 'offline' && (
                <Alert tone="warn">회원 서비스 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.</Alert>
              )}
              {error && <Alert tone="danger">{error}</Alert>}
              {needsPassword && (
                <Alert
                  tone="info"
                  title="회원명부에 등록된 회원입니다"
                  action={<ButtonLink to={`/password-reset?email=${encodeURIComponent(needsPassword)}`} size="sm">비밀번호 만들기</ButtonLink>}
                >
                  처음 한 번만 이메일로 비밀번호를 만들면, 기존 회원 자격 그대로 로그인할 수 있습니다.
                </Alert>
              )}
            </div>
          )}

          <div className="ms-login-field">
            <label className="ms-label" htmlFor="login-email">아이디 (이메일)</label>
            <input
              id="login-email"
              type="email"
              className="ms-input"
              placeholder="example@srmq.or.kr"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoFocus
            />
          </div>
          <div className="ms-login-field">
            <label className="ms-label" htmlFor="login-password">비밀번호</label>
            <PasswordInput
              id="login-password"
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="ms-login-options">
            <Checkbox checked={form.remember} onChange={(v) => setForm({ ...form, remember: v })}>
              로그인 상태 유지
            </Checkbox>
            <Link to="/password-reset" className="ms-link ms-link-muted ms-text-sm">비밀번호 찾기</Link>
          </div>

          <Button type="submit" block size="lg" loading={submitting}>로그인</Button>
        </form>

        <div className="ms-login-links">
          <span>아직 회원이 아니신가요?</span>
          <Link to="/signup" className="ms-link">회원가입</Link>
        </div>
      </Card>

      <Card className="ms-login-guide">
        <div className="ms-space-between">
          <div>
            <p className="ms-strong ms-mt-0" style={{ margin: 0, fontSize: 14 }}>회원 유형과 회비가 궁금하신가요?</p>
            <p className="ms-muted ms-text-sm" style={{ margin: '4px 0 0' }}>일반 · 기업 · 특별 회원의 혜택과 금액을 확인하세요.</p>
          </div>
          <ButtonLink to="/members" variant="outline" size="sm" iconRight={<ArrowRightIcon size={14} />}>회원 안내</ButtonLink>
        </div>
      </Card>
    </MemberPage>
  );
}
