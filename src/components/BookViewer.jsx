import React, { useState } from 'react';
import CoverPage from './pages/CoverPage';
import GreetingPage from './pages/GreetingPage';
import ProgramPage from './pages/ProgramPage';
import EvaluationPage from './pages/EvaluationPage';
import MemberPage from './pages/MemberPage';
import ContactPage from './pages/ContactPage';

export default function BookViewer() {
  const [spreadIndex, setSpreadIndex] = useState(0);

  // 스프레드 페이지 목록 (좌우 2페이지씩 구성)
  const spreads = [
    { left: <CoverPage />, right: <GreetingPage /> },
    { left: <ProgramPage />, right: <EvaluationPage /> },
    { left: <MemberPage />, right: <ContactPage /> },
  ];

  const nextSpread = () => {
    if (spreadIndex < spreads.length - 1) setSpreadIndex(spreadIndex + 1);
  };

  const prevSpread = () => {
    if (spreadIndex > 0) setSpreadIndex(spreadIndex - 1);
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-slate-900 flex flex-col items-center justify-center p-6 relative">
      {/* 책자 스프레드 컨테이너 (A4 비율 2장 나란히 배치: 약 1414px × 840px 비율) */}
      <div className="w-[1400px] h-[820px] bg-white shadow-2xl rounded-lg flex overflow-hidden border border-slate-700 relative">
        {/* 왼쪽 페이지 */}
        <div className="w-1/2 h-full border-r border-gray-200 bg-white p-10 overflow-y-auto relative flex flex-col justify-between">
          {spreads[spreadIndex].left}
        </div>

        {/* 오른쪽 페이지 */}
        <div className="w-1/2 h-full bg-white p-10 overflow-y-auto relative flex flex-col justify-between">
          {spreads[spreadIndex].right}
        </div>
      </div>

      {/* 페이지 컨트롤러 바 */}
      <div className="mt-4 flex items-center space-x-6 text-white">
        <button
          onClick={prevSpread}
          disabled={spreadIndex === 0}
          className={`px-4 py-2 rounded bg-slate-800 font-subtitle hover:bg-slate-700 disabled:opacity-30`}
        >
          ◀ 이전 페이지
        </button>
        <span className="font-subtitle text-lime-400">
          Spread {spreadIndex + 1} / {spreads.length}
        </span>
        <button
          onClick={nextSpread}
          disabled={spreadIndex === spreads.length - 1}
          className={`px-4 py-2 rounded bg-slate-800 font-subtitle hover:bg-slate-700 disabled:opacity-30`}
        >
          다음 페이지 ▶
        </button>
      </div>
    </div>
  );
}