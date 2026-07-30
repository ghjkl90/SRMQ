import React, { useState } from 'react';
import Header from './components/Header';
import CoverPage from './components/pages/CoverPage';
import GreetingPage from './components/pages/GreetingPage';
import VisionPage from './components/pages/VisionPage';
import PurposePage from './components/pages/PurposePage';
import AwardPage from './components/pages/AwardPage';
import EvaluationPage from './components/pages/EvaluationPage';
import FuturePage from './components/pages/FuturePage';
import MembersPage from './components/pages/MembersPage';
import BestEsgPage from './components/pages/BestEsgPage';
import OrgPage from './components/pages/OrgPage';
import HistoryPage from './components/pages/HistoryPage';

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('home');
  const [currentSubmenu, setCurrentSubmenu] = useState('표지');

  const handleSelectSubmenu = (menuId, subLabel) => {
    setCurrentMenu(menuId);
    setCurrentSubmenu(subLabel);
  };

  const renderContent = () => {
    // 1. 홈 / 기본 메인 화면 관련
    if (currentSubmenu === '표지' || currentSubmenu === 'home') {
      return <CoverPage />;
    }
    if (currentSubmenu === '인사말') {
      return <GreetingPage />;
    }
    if (currentSubmenu === '설립목적') {
      return <PurposePage />;
    }

    // 2. 회원 안내 (기부자 현황 등)
    if (currentSubmenu === '기부자 현황' || currentSubmenu === '회원 안내') {
      return <MembersPage />;
    }

    // 3. 우수 ESG 기업 (역대 수상조직)
    if (currentSubmenu === '역대 수상조직' || currentSubmenu === '한국 베스트 ESG 기업') {
      return <BestEsgPage />;
    }

    // 4. 기관 안내 (조직도 등)
    if (currentSubmenu === '조직도') {
      return <OrgPage />;
    }

    // 5. 연혁 & 네트워크 페이지
    if (currentSubmenu === '연혁 & 네트워크' || currentSubmenu.includes('연혁')) {
      return <HistoryPage />;
    }


    // 5. 포상제도 관련 페이지들
    const awardSubmenus = [
      '의의 및 분야', 
      '분야별 응모 및 시상 기준', 
      '포상제도 운영 일정', 
      '포상 갤러리', 
      '포상제도', 
      'SRMQ포상'
    ];
    if (awardSubmenus.includes(currentSubmenu)) {
      return <AwardPage />;
    }

    // 6. 진단 / 평가 관련 페이지들
    if (
      currentSubmenu.includes('진단') || 
      currentSubmenu.includes('평가') ||
      currentMenu === 'evaluation' ||
      currentMenu === '진단/평가'
    ) {
      return <EvaluationPage />;
    }

    // 7. 발전방향 관련 페이지들
    if (
      currentSubmenu.includes('발전방향') || 
      currentSubmenu.includes('FUTURE') ||
      currentSubmenu === 'SRMQ명예의전당' ||
      currentSubmenu.includes('방향')
    ) {
      return <FuturePage />;
    }

    // 8. 일치하는 매뉴가 없을 경우 준비 중 화면
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{currentSubmenu}</h2>
        <p className="text-gray-500">해당 페이지 준비 중입니다.</p>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden font-sans">
      <Header 
        currentMenu={currentMenu} 
        setCurrentMenu={setCurrentMenu} 
        onSelectSubmenu={handleSelectSubmenu}
      />

      <main className="flex-1 w-full h-full overflow-y-auto flex flex-col items-center">
        <div className="w-full h-full bg-white relative flex flex-col justify-between">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}