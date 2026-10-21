import React, { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import { PAGES, REDIRECTS, SITE_NAME, findPageByPath } from './routes';

// 등록되지 않은 주소로 들어왔을 때
function NotFoundPage() {
  return (
    <div className="not-found">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-500 mb-6">주소가 바뀌었거나 준비 중인 페이지입니다.</p>
      <Link to="/" className="not-found-link">첫 화면으로</Link>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();

  // 페이지가 바뀌면 맨 위로 (모바일은 문서 전체가 스크롤되므로 필요)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 브라우저 탭 제목
  useEffect(() => {
    const page = findPageByPath(pathname);
    document.title = page?.title ? `${page.title} | ${SITE_NAME}` : SITE_NAME;
  }, [pathname]);

  return (
    <div className="app-shell font-sans">
      <Header />

      <main className="app-main">
        <div className="app-main-inner">
          <Routes>
            {PAGES.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            {REDIRECTS.map(({ from, to }) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
