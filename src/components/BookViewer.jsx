import React from 'react';
import CoverPage from './pages/CoverPage';
import GreetingPage from './pages/GreetingPage';

export default function BookViewer() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* 1920x1080 화면 비율에 맞춘 A4 책자 스프레드 프레임 */}
      <div className="w-[1400px] h-[800px] bg-white shadow-2xl rounded-lg flex overflow-hidden border border-slate-700">
        {/* 왼쪽 페이지 (표지 디자인 영역) */}
        <div className="w-1/2 h-full border-r border-gray-200 bg-white p-10 overflow-y-auto">
          <CoverPage />
        </div>
        {/* 오른쪽 페이지 (인사말 영역) */}
        <div className="w-1/2 h-full bg-white p-10 overflow-y-auto">
          <GreetingPage />
        </div>
      </div>
    </div>
  );
}