// src/auth/AuthContext.jsx
// 로그인 상태를 앱 전체에서 공유합니다. 어디서든 const { user, isAdmin, login, logout } = useAuth();
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading: 확인 중 · ready: 확인 완료 · offline: API 서버에 연결 안 됨(백엔드 배포 전 등)
  const [status, setStatus] = useState('loading');

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data?.user ?? null);
      setStatus('ready');
      return data?.user ?? null;
    } catch (err) {
      setUser(null);
      setStatus(err.status ? 'ready' : 'offline');
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async ({ email, password, remember }) => {
    const data = await api.post('/api/auth/login', { email, password, remember });
    setUser(data.user);
    setStatus('ready');
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api.post('/api/auth/signup', payload);
    setUser(data.user);
    setStatus('ready');
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      loading: status === 'loading',
      isLoggedIn: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      refresh,
      login,
      signup,
      logout,
      setUser,
    }),
    [user, status, refresh, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 <AuthProvider> 안에서만 쓸 수 있습니다. (main.jsx 확인)');
  return ctx;
}
