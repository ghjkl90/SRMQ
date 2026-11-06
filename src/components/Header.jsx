import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo-2.png';
import { useAuth } from '../auth/AuthContext';
import { MENUS, findMenuByPath, isCurrentPath } from '../routes';
import './Header.css';

const MOBILE_BREAKPOINT = 1024; // Header.css 의 @media (max-width: 1024px) 와 같은 값

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </svg>
);

/* PC: 검색 버튼 오른쪽의 로그인 / 회원 메뉴 */
function AuthMenu() {
  const { user, isAdmin, logout, status } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status === 'loading') return <span className="auth-menu-placeholder" aria-hidden="true" />;

  if (!user) {
    return (
      <div className="auth-menu">
        <Link to="/login" className="auth-login-btn">로그인</Link>
        <Link to="/signup" className="auth-join-link">회원가입</Link>
      </div>
    );
  }

  return (
    <div className="auth-menu" ref={boxRef}>
      <button
        type="button"
        className={`auth-user-btn ${open ? 'is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <UserIcon />
        <span className="auth-user-name">{user.name}님</span>
        <ChevronIcon />
      </button>
      {open && (
        <div className="auth-dropdown" role="menu">
          <div className="dropdown-top-line"></div>
          <Link to="/mypage" className="dropdown-item" role="menuitem">마이페이지</Link>
          <Link to="/membership/checkout" className="dropdown-item" role="menuitem">회비 납부</Link>
          {isAdmin && <Link to="/admin" className="dropdown-item" role="menuitem">관리자 콘솔</Link>}
          <button
            type="button"
            className="dropdown-item auth-logout"
            role="menuitem"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const activeMenuId = findMenuByPath(pathname)?.id ?? null;

  // PC 드롭다운
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);

  // 모바일 메뉴
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const closeAll = () => {
    setHoveredMenu(null);
    setHoveredSubmenu(null);
    setMobileOpen(false);
  };

  // 페이지가 바뀌면 열린 메뉴 닫기
  useEffect(() => {
    closeAll();
  }, [pathname]);

  // 모바일 메뉴를 열 때 현재 페이지가 속한 메뉴를 펼쳐 둠
  useEffect(() => {
    if (mobileOpen) setExpandedMenu(activeMenuId);
  }, [mobileOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 모바일 메뉴가 열려 있는 동안: 뒤 화면 스크롤 잠금, Esc 로 닫기, 화면이 넓어지면 닫기
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    const handleResize = () => window.innerWidth > MOBILE_BREAKPOINT && setMobileOpen(false);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileOpen]);

  const hoveredChildren =
    MENUS.find((m) => m.id === hoveredMenu)?.items.find((item) => item.label === hoveredSubmenu)?.children;

  return (
    <header
      className={`header-container ${mobileOpen ? 'is-mobile-open' : ''}`}
      onMouseLeave={() => {
        setHoveredMenu(null);
        setHoveredSubmenu(null);
      }}
    >
      <div className="header-inner">
        <Link to="/" className="header-logo" onClick={closeAll}>
          <img src={logoImg} alt="사회책임경영품질원 로고" />
        </Link>

        {/* ===== PC 메뉴 ===== */}
        <nav className="header-nav" aria-label="주 메뉴">
          {MENUS.map((menu) => {
            const isActive = activeMenuId === menu.id;
            const isHovered = hoveredMenu === menu.id;

            return (
              <div
                key={menu.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onMouseEnter={() => {
                  setHoveredMenu(menu.id);
                  setHoveredSubmenu(null);
                }}
                onClick={() => {
                  closeAll();
                  navigate(menu.items[0].path);
                }}
              >
                <button type="button" className="nav-link">
                  {menu.label}
                </button>

                {isActive && <div className="active-indicator"></div>}

                {isHovered && menu.items.length > 0 && (
                  <div className="dropdown-menu">
                    {/* 2단계: 하위 세부과정 (children 이 있는 항목에 마우스를 올렸을 때) */}
                    {hoveredChildren && (
                      <div className="dropdown-submenu-panel">
                        <div className="dropdown-top-line"></div>
                        {hoveredChildren.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={(e) => {
                              e.stopPropagation();
                              closeAll();
                            }}
                            className="dropdown-child-item"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* 1단계: 기본 서브메뉴 */}
                    <div className="dropdown-main-panel">
                      <div className="dropdown-top-line"></div>
                      {menu.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onMouseEnter={() => setHoveredSubmenu(item.label)}
                          onClick={(e) => {
                            e.stopPropagation();
                            closeAll();
                          }}
                          className={`dropdown-item ${hoveredSubmenu === item.label ? 'highlight' : ''}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button type="button" className="search-btn" aria-label="검색">
            <SearchIcon />
          </button>

          <AuthMenu />
        </nav>

        {/* ===== 모바일: 햄버거 버튼 ===== */}
        <button
          type="button"
          className={`mobile-menu-btn ${mobileOpen ? 'is-open' : ''}`}
          aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* ===== 모바일 메뉴 패널 ===== */}
      {mobileOpen && (
        <>
          <div className="mobile-nav-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav className="mobile-nav" id="mobile-nav" aria-label="모바일 메뉴">
            {/* 회원 메뉴 (로그인 · 회원가입 / 마이페이지 · 로그아웃) */}
            <div className="mobile-auth">
              {user ? (
                <>
                  <p className="mobile-auth-hello"><b>{user.name}</b>님 환영합니다</p>
                  <div className="mobile-auth-links">
                    <Link to="/mypage" onClick={closeAll}>마이페이지</Link>
                    <Link to="/membership/checkout" onClick={closeAll}>회비 납부</Link>
                    {isAdmin && <Link to="/admin" onClick={closeAll}>관리자</Link>}
                    <button
                      type="button"
                      onClick={async () => {
                        closeAll();
                        await logout();
                        navigate('/');
                      }}
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <div className="mobile-auth-links is-guest">
                  <Link to="/login" className="is-primary" onClick={closeAll}>로그인</Link>
                  <Link to="/signup" onClick={closeAll}>회원가입</Link>
                </div>
              )}
            </div>

            {MENUS.map((menu) => {
              const isActive = activeMenuId === menu.id;

              // 하위 메뉴가 1개뿐이면 바로 이동하는 링크로 표시
              if (menu.items.length === 1 && !menu.items[0].children) {
                return (
                  <Link
                    key={menu.id}
                    to={menu.items[0].path}
                    className={`mobile-nav-group mobile-nav-direct ${isActive ? 'active' : ''}`}
                    onClick={closeAll}
                  >
                    {menu.label}
                  </Link>
                );
              }

              const expanded = expandedMenu === menu.id;
              return (
                <div key={menu.id} className={`mobile-nav-group ${isActive ? 'active' : ''}`}>
                  <button
                    type="button"
                    className={`mobile-nav-toggle ${expanded ? 'is-expanded' : ''}`}
                    aria-expanded={expanded}
                    onClick={() => setExpandedMenu(expanded ? null : menu.id)}
                  >
                    {menu.label}
                    <ChevronIcon />
                  </button>

                  {expanded && (
                    <ul className="mobile-nav-sub">
                      {menu.items.map((item) => (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={isCurrentPath(pathname, item.path) ? 'is-current' : ''}
                            aria-current={isCurrentPath(pathname, item.path) ? 'page' : undefined}
                            onClick={closeAll}
                          >
                            {item.label}
                          </Link>
                          {item.children && (
                            <ul className="mobile-nav-children">
                              {item.children.map((child) => (
                                <li key={child.path}>
                                  <Link
                                    to={child.path}
                                    className={isCurrentPath(pathname, child.path) ? 'is-current' : ''}
                                    onClick={closeAll}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </>
      )}
    </header>
  );
}
