// src/auth/RouteGuards.jsx
// routes.jsx 의 guard 값에 따라 App.jsx 에서 페이지를 감쌉니다.
//   guard: 'auth'  → 로그인한 회원만 (아니면 /login?next=현재주소 로 이동)
//   guard: 'admin' → 관리자만
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../components/member/memberService.css';

function GuardMessage({ title, children }) {
  return (
    <div className="subpage-container">
      <div className="subpage-content">
        <div className="ms-guard">
          <h2 className="ms-guard-title">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

function Checking() {
  return (
    <GuardMessage title="회원 정보를 확인하고 있습니다">
      <span className="ms-spinner" aria-hidden="true" />
    </GuardMessage>
  );
}

function Offline() {
  return (
    <GuardMessage title="회원 서비스에 연결할 수 없습니다">
      <p className="ms-guard-text">잠시 후 다시 시도해 주세요. 문제가 계속되면 사무국(02-408-9171)으로 연락 바랍니다.</p>
      <Link to="/" className="ms-btn ms-btn-outline">첫 화면으로</Link>
    </GuardMessage>
  );
}

export const loginPath = (location) =>
  `/login?next=${encodeURIComponent(location.pathname + location.search)}`;

export function RequireAuth({ children }) {
  const { user, loading, status } = useAuth();
  const location = useLocation();
  if (loading) return <Checking />;
  if (status === 'offline') return <Offline />;
  if (!user) return <Navigate to={loginPath(location)} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading, status, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <Checking />;
  if (status === 'offline') return <Offline />;
  if (!user) return <Navigate to={loginPath(location)} replace />;
  if (!isAdmin) {
    return (
      <GuardMessage title="관리자만 이용할 수 있는 페이지입니다">
        <p className="ms-guard-text">관리자 계정으로 다시 로그인해 주세요.</p>
        <Link to="/" className="ms-btn ms-btn-outline">첫 화면으로</Link>
      </GuardMessage>
    );
  }
  return children;
}

export function withGuard(guard, element) {
  if (guard === 'auth') return <RequireAuth>{element}</RequireAuth>;
  if (guard === 'admin') return <RequireAdmin>{element}</RequireAdmin>;
  return element;
}

/** ?next= 값이 우리 사이트 안의 주소일 때만 사용 (외부 사이트로 튕기는 공격 방지) */
export function safeNext(value, fallback = '/mypage') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
