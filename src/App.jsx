import React, { useState } from 'react';

// 공통 이미지 리소스 객체
const IMAGES = {
  coverPlant: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
  greetingStones: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  visionCompass: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  awardHall: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
};

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('home');
  const [spreadIndex, setSpreadIndex] = useState(0);

  const menus = [
    { id: 'home', label: '사경원 소개' },
    { id: 'eval', label: '진단/평가' },
    { id: 'award', label: 'SRMQ포상' },
    { id: 'edu', label: '교육' },
    { id: 'research', label: '정책연구' },
    { id: 'donation', label: '기부금후원' },
    { id: 'notice', label: '공지사항' },
  ];

  // 책자 스프레드 페이지 데이터 (좌우 쌍)
  const spreads = [
    {
      // 1번 스프레드 (표지 & 인사말)
      left: (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="w-12 h-12 bg-[#82C91E] rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-6 shadow-md">Q</div>
            <h1 className="text-[32px] font-bold text-gray-900 mb-2 leading-tight">사회책임경영품질원</h1>
            <p className="text-[20px] font-semibold text-[#82C91E] mb-6">Social Responsibility & Management Quality Institute</p>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
            </p>
          </div>
          <div className="w-full h-64 rounded-xl relative overflow-hidden shadow-inner bg-cover bg-center" style={{ backgroundImage: `url('${IMAGES.coverPlant}')` }}>
            <div className="absolute inset-0 bg-black/20 flex items-end p-4">
              <span className="text-[11px] text-white bg-black/50 px-3 py-1 rounded backdrop-blur-sm">🌱 지속가능경영 비전 목업</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 pt-4 border-t border-gray-100">
            <span>기획재정부 승인 비영리법인</span>
            <span>www.srmq.or.kr</span>
          </div>
        </div>
      ),
      right: (
        <div className="flex flex-col justify-between h-full bg-[#0B4F4A] text-white p-2 rounded-lg">
          <div>
            <span className="bg-[#82C91E] text-white text-[11px] font-semibold px-3 py-1 rounded mb-4 inline-block">인사말 GREETING</span>
            <h2 className="text-[32px] font-bold text-white mb-4 leading-tight">책임 있는 경영이 지속가능한 미래를 만듭니다.</h2>
            <p className="text-[14px] text-emerald-100 leading-relaxed mb-4">
              AX 시대를 맞이하여 모든 조직의 경영환경은 급속히 변화하고 있습니다. 투명성 제고와 사회적책임의 실행을 통해 지속가능한 성장을 이끕니다.
            </p>
          </div>
          <div className="w-full h-48 rounded-lg relative overflow-hidden shadow-lg bg-cover bg-center" style={{ backgroundImage: `url('${IMAGES.greetingStones}')` }}>
            <div className="absolute bottom-3 left-3 text-[20px] font-semibold text-white drop-shadow-md">
              회장 박성현
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-emerald-200 pt-4 border-t border-emerald-800">
            <span>(사)사회책임경영품질원</span>
            <span>02</span>
          </div>
        </div>
      )
    },
    {
      // 2번 스프레드 (비전 & 주요사업)
      left: (
        <div className="flex flex-col justify-between h-full">
          <div>
            <span className="bg-slate-800 text-white text-[11px] font-semibold px-3 py-1 rounded mb-4 inline-block">비전·핵심가치 VISION & CORE VALUES</span>
            <h2 className="text-[32px] font-bold text-gray-900 mb-4 leading-tight">글로벌 경쟁력 강화</h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
              기업과 조직이 신뢰와 존중을 바탕으로 글로벌 경쟁력을 향상하고 지속가능한 발전을 이룰 수 있도록 돕습니다.
            </p>
          </div>
          <div className="w-full h-56 rounded-xl relative overflow-hidden shadow-md bg-cover bg-center" style={{ backgroundImage: `url('${IMAGES.visionCompass}')` }}></div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 pt-4 border-t border-gray-100">
            <span>사회책임경영품질원</span>
            <span>03</span>
          </div>
        </div>
      ),
      right: (
        <div className="flex flex-col justify-between h-full">
          <div>
            <span className="bg-[#82C91E] text-white text-[11px] font-semibold px-3 py-1 rounded mb-4 inline-block">설립목적·주요사업</span>
            <h2 className="text-[32px] font-bold text-gray-900 mb-4 leading-tight">주요사업 안내</h2>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-[20px] font-semibold text-gray-900 mb-1">진단과 평가</h4>
                <p className="text-[14px] text-gray-600">사회적 책임·경영품질·ESG 안전보건경영 진단 및 평가 실시</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-[20px] font-semibold text-gray-900 mb-1">포상제도 운영</h4>
                <p className="text-[14px] text-gray-600">바람직한 경영모델 및 평가지표 개발을 통한 우수 조직 포상</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-gray-400 pt-4 border-t border-gray-100">
            <span>사회책임경영품질원</span>
            <span>04</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-900 overflow-hidden font-sans">
      {/* 상단 네비게이션 바 */}
      <header className="w-full bg-white border-b border-gray-200 px-12 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="w-9 h-9 bg-[#82C91E] rounded-lg flex items-center justify-center text-white font-bold text-lg">Q</div>
          <div>
            <span className="text-[20px] font-semibold text-gray-900 tracking-tight">사회책임경영품질원</span>
            <p className="text-[11px] text-gray-400">Social Responsibility & Management Quality Institute</p>
          </div>
        </div>
        <nav className="flex items-center space-x-6">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setCurrentMenu(menu.id)}
              className={`text-[20px] font-semibold transition-colors hover:text-[#82C91E] ${
                currentMenu === menu.id ? 'text-[#82C91E] border-b-2 border-[#82C91E] pb-1' : 'text-gray-700'
              }`}
            >
              {menu.label}
            </button>
          ))}
        </nav>
        <div className="text-gray-600 cursor-pointer p-2 hover:bg-gray-100 rounded-full">
          🔍
        </div>
      </header>

      {/* 중앙 브로슈어 책자 뷰어 영역 (1920x1080 최적화) */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
        <div className="w-[1300px] h-[750px] bg-white shadow-2xl rounded-lg flex overflow-hidden border border-slate-700">
          {/* 왼쪽 페이지 */}
          <div className="w-1/2 h-full border-r border-gray-200 bg-white p-8 overflow-y-auto">
            {spreads[spreadIndex].left}
          </div>
          {/* 오른쪽 페이지 */}
          <div className="w-1/2 h-full bg-white p-8 overflow-y-auto">
            {spreads[spreadIndex].right}
          </div>
        </div>

        {/* 페이지 넘기기 컨트롤러 */}
        <div className="mt-4 flex items-center space-x-6 text-white">
          <button
            onClick={() => setSpreadIndex(prev => Math.max(0, prev - 1))}
            disabled={spreadIndex === 0}
            className="px-4 py-2 rounded bg-slate-800 text-[14px] hover:bg-slate-700 disabled:opacity-30"
          >
            ◀ 이전 페이지
          </button>
          <span className="text-[14px] font-semibold text-[#82C91E]">
            Spread {spreadIndex + 1} / {spreads.length}
          </span>
          <button
            onClick={() => setSpreadIndex(prev => Math.min(spreads.length - 1, prev + 1))}
            disabled={spreadIndex === spreads.length - 1}
            className="px-4 py-2 rounded bg-slate-800 text-[14px] hover:bg-slate-700 disabled:opacity-30"
          >
            다음 페이지 ▶
          </button>
        </div>
      </main>
    </div>
  );
}