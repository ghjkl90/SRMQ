import React from 'react';

export default function Header({ currentMenu, setCurrentMenu }) {
  const menus = [
    { id: 'home', label: '사경원 소개' },
    { id: 'eval', label: '진단/평가' },
    { id: 'award', label: 'SRMQ포상' },
    { id: 'edu', label: '교육' },
    { id: 'research', label: '정책연구' },
    { id: 'donation', label: '기부금후원' },
    { id: 'notice', label: '공지사항' },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 px-12 py-4 flex items-center justify-between shadow-sm">
      {/* 로고 영역 */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentMenu('home')}>
        <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
          Q
        </div>
        <div>
          <span className="font-subtitle text-gray-900 tracking-tight">사회책임경영품질원</span>
          <p className="font-caption text-gray-400">Social Responsibility & Management Quality Institute</p>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex items-center space-x-8">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => setCurrentMenu(menu.id)}
            className={`font-subtitle transition-colors hover:text-lime-600 ${
              currentMenu === menu.id ? 'text-lime-600 border-b-2 border-lime-600 pb-1' : 'text-gray-700'
            }`}
          >
            {menu.label}
          </button>
        ))}
      </nav>

      {/* 검색 아이콘 */}
      <div className="text-gray-600 cursor-pointer p-2 hover:bg-gray-100 rounded-full">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </header>
  );
}