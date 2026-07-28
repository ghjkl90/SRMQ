import React, { useState } from 'react';
import logoImg from '../assets/logo-2.png';
import './Header.css';

export default function Header({ currentMenu, setCurrentMenu, onSelectSubmenu }) {
  const menuData = [
    {
      id: 'home',
      label: '사경원 소개',
      submenus: ['인사말', '설립목적', '연혁', '주요사업', '조직도', 'C.I.', '오시는길']
    },
    {
      id: 'eval',
      label: '진단/평가',
      submenus: ['사회책임 진단/평가', 'ESG경영 진단/평가', '경영품질 진단/평가', 'ISO 26000 운영수준 진단']
    },
    {
      id: 'award',
      label: 'SRMQ포상',
      submenus: ['의의 및 분야', '분야별 응모 및 시상 기준', '포상제도 운영 일정', '역대 수상조직', 'SRMQ명예의전당', '포상 갤러리']
    },
    {
      id: 'edu',
      label: '교육',
      submenus: ['공개교육', '맞춤 교육']
    },
    {
      id: 'research',
      label: '정책연구',
      submenus: ['연구보고서', '정책제안']
    },
    {
      id: 'donation',
      label: '기부금후원',
      submenus: ['기부금후원안내', '기부자 현황', '기부금 모금액 및 활용실적']
    },
    {
      id: 'notice',
      label: '공지사항',
      submenus: ['공지사항', '사경원 뉴스']
    }
  ];

  const [hoveredMenu, setHoveredMenu] = useState(null);

  const handleSubmenuClick = (menuId, subLabel) => {
    setCurrentMenu(menuId);
    setHoveredMenu(null);
    if (onSelectSubmenu) {
      onSelectSubmenu(menuId, subLabel);
    }
  };

  return (
    <header className="header-container" onMouseLeave={() => setHoveredMenu(null)}>
      <div className="header-inner">
        {/* 로고 클릭 시 홈(표지)으로 이동 */}
        <div className="header-logo" onClick={() => handleSubmenuClick('home', '표지')}>
          <img src={logoImg} alt="사회책임경영품질원 로고" />
        </div>

        <nav className="header-nav">
          {menuData.map((menu) => {
            const isActive = currentMenu === menu.id;
            const isHovered = hoveredMenu === menu.id;

            return (
              <div 
                key={menu.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setHoveredMenu(menu.id)}
                onClick={() => handleSubmenuClick(menu.id, menu.submenus[0])}
              >
                <button className="nav-link">
                  {menu.label}
                </button>

                {isActive && <div className="active-indicator"></div>}

                {isHovered && menu.submenus.length > 0 && (
                  <div className="dropdown-menu">
                    <div className="dropdown-top-line"></div>
                    {menu.submenus.map((sub, idx) => (
                      <a
                        key={idx}
                        href="#none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmenuClick(menu.id, sub);
                        }}
                        className="dropdown-item"
                      >
                        {sub}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button className="search-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}