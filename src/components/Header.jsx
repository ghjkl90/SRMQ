import React, { useState } from 'react';
import logoImg from '../assets/logo-2.png';
import './Header.css';

export default function Header({ currentMenu, setCurrentMenu, onSelectSubmenu }) {
  const menuData = [
    {
      id: 'home',
      label: '사경원 소개',
      submenus: ['인사말', '설립목적', '연혁', '조직도', 'C.I.', '오시는길']
    },
    {
      id: 'eval',
      label: '진단/평가',
      submenus: ['사회책임 진단/평가', 'ESG경영 진단/평가', '경영품질 진단/평가', 'ISO 26000 운영수준 진단']
    },
    {
      id: 'award',
      label: 'SRMQ포상',
      submenus: ['의의 및 분야', '분야별 응모 및 시상 기준', '포상 심사 및 운영 절차', '역대 수상조직', 'SRMQ명예의전당', '포상 갤러리']
    },
    {
<<<<<<< HEAD
  id: 'edu',
  label: '교육',
  submenus: [
    '교육과정'
  ]
},
=======
      id: 'edu',
      label: '교육',
      submenus: [
        {
          name: '공개교육',
          children: ['SR(사회적책임)지도자 과정', 'ESG 경영전략 과정']
        },
        '맞춤 교육'
      ]
    },
>>>>>>> d96e3641c91227e69548784b5fc61c4f4b665c91
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
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);

  const handleSubmenuClick = (menuId, subLabel) => {
    setCurrentMenu(menuId);
    setHoveredMenu(null);
    setHoveredSubmenu(null);
    if (onSelectSubmenu) {
      onSelectSubmenu(menuId, subLabel);
    }
  };

  const getFirstSubmenuName = (menu) => {
    if (!menu.submenus || menu.submenus.length === 0) return '';
    const first = menu.submenus[0];
    return typeof first === 'string' ? first : first.name;
  };

  return (
    <header 
      className="header-container" 
      onMouseLeave={() => {
        setHoveredMenu(null);
        setHoveredSubmenu(null);
      }}
    >
      <div className="header-inner">
        {/* 로고 */}
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
                onMouseEnter={() => {
                  setHoveredMenu(menu.id);
                  // 교육 메뉴 진입 시 자동으로 공개교육 하위 메뉴가 뜨도록 셋팅
                  if (menu.id === 'edu') {
                    setHoveredSubmenu('공개교육');
                  } else {
                    setHoveredSubmenu(null);
                  }
                }}
                onClick={() => handleSubmenuClick(menu.id, getFirstSubmenuName(menu))}
              >
                <button className="nav-link">
                  {menu.label}
                </button>

                {isActive && <div className="active-indicator"></div>}

                {isHovered && menu.submenus.length > 0 && (
                  <div className="dropdown-menu">
                    {menu.submenus.some(
                      (item) => typeof item === 'object' && item.name === hoveredSubmenu && item.children
                    ) && (
                      <div className="dropdown-submenu-panel">
                        <div className="dropdown-top-line"></div>
                        {menu.submenus
                          .find((item) => typeof item === 'object' && item.name === hoveredSubmenu)
                          ?.children.map((child, cIdx) => (
                            <a
                              key={cIdx}
                              href="#none"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmenuClick(menu.id, child);
                              }}
                              className="dropdown-child-item"
                            >
                              {child}
                            </a>
                          ))}
                      </div>
                    )}

                    {/* 1단계: 기본 메인 서브메뉴 리스트 (오른쪽 노출) */}
                    <div className="dropdown-main-panel">
                      <div className="dropdown-top-line"></div>
                      {menu.submenus.map((sub, idx) => {
                        const subName = typeof sub === 'string' ? sub : sub.name;
                        const isSubActive = hoveredSubmenu === subName;

                        return (
                          <a
                            key={idx}
                            href="#none"
                            onMouseEnter={() => setHoveredSubmenu(subName)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmenuClick(menu.id, subName);
                            }}
                            className={`dropdown-item ${isSubActive ? 'highlight' : ''}`}
                          >
                            {subName}
                          </a>
                        );
                      })}
                    </div>

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