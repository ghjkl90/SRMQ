import React, { useState } from 'react';
import Header from './components/Header';
<<<<<<< HEAD
import CoverPage from './components/pages/ProgramPage';
=======
import CoverPage from './components/pages/CoverPage';
>>>>>>> d96e3641c91227e69548784b5fc61c4f4b665c91
import GreetingPage from './components/pages/GreetingPage';
import VisionPage from './components/pages/VisionPage';
import PurposePage from './components/pages/PurposePage';
import AwardPage from './components/pages/AwardPage';
import AwardPage2 from './components/pages/AwardPage2'; // 1. AwardPage2 임포트 추가
import EvaluationPage from './components/pages/EvaluationPage';
import FuturePage from './components/pages/FuturePage';
import MembersPage from './components/pages/MembersPage';
import BestEsgPage from './components/pages/BestEsgPage';
import OrgPage from './components/pages/OrgPage';
import HistoryPage from './components/pages/HistoryPage';
import CiPage from "./components/pages/CiPage";
import LocationPage from './components/pages/Location';
import AwardProcessPage from './components/pages/AwardProcessPage';
import AwardCriteriaPage from './components/pages/AwardCriteriaPage';
import EducationCoursePage from './components/pages/EducationCoursePage';
import PolicyResearchPage from './components/pages/PolicyResearchPage';
import DonationPage from './components/pages/DonationPage';
import NoticePage from './components/pages/NoticePage';
<<<<<<< HEAD
import AwardGalleryPage from './components/pages/AwardGalleryPage';
=======
>>>>>>> d96e3641c91227e69548784b5fc61c4f4b665c91


export default function App() {
  const [currentMenu, setCurrentMenu] = useState('home');
  const [currentSubmenu, setCurrentSubmenu] = useState('표지');

  const handleSelectSubmenu = (menuId, subLabel) => {
    setCurrentMenu(menuId);
    setCurrentSubmenu(subLabel);
  };

  const renderContent = () => {
    if (currentSubmenu === '표지' || currentSubmenu === 'home') {
      return <CoverPage />;
    }
    if (currentSubmenu === '인사말') {
      return <GreetingPage />;
    }
    if (currentSubmenu === '설립목적') {
      return <PurposePage />;
    }

    if (currentSubmenu === '의의 및 분야') {
      return <AwardPage2 />;
    }

    if (currentSubmenu === '기부자 현황' || currentSubmenu === '회원 안내') {
      return <MembersPage />;
    }

    if (currentSubmenu === '역대 수상조직' || currentSubmenu === '한국 베스트 ESG 기업') {
      return <BestEsgPage />;
    }

    if (currentSubmenu === '조직도') {
      return <OrgPage />;
    }

    if (currentSubmenu === '연혁 & 네트워크' || currentSubmenu.includes('연혁')) {
      return <HistoryPage />;
    }

    if (currentSubmenu === 'C.I.' || currentSubmenu.includes('CI')) {
      return <CiPage />;
    }

    if (currentSubmenu === '오시는길' || currentSubmenu.includes('LOCATION')) {
      return <LocationPage />;
    }

    if (currentSubmenu === '포상 심사 및 운영 절차') {
      return <AwardProcessPage />;
    }
    if (currentSubmenu === '분야별 응모 및 시상 기준') {
      return <AwardCriteriaPage />;
    }

<<<<<<< HEAD
    if (currentSubmenu === '교육과정') {
=======
    if (currentSubmenu === '공개교육') {
>>>>>>> d96e3641c91227e69548784b5fc61c4f4b665c91
      return <EducationCoursePage />;
    }

    if (currentSubmenu === '연구보고서') {
      return <PolicyResearchPage />;
    }

<<<<<<< HEAD
    if (currentSubmenu === '포상 갤러리') {
      return <AwardGalleryPage />;
    }

=======
>>>>>>> d96e3641c91227e69548784b5fc61c4f4b665c91
    if (currentSubmenu === '기부금후원안내' || currentSubmenu === '기부금 모금액 및 활용실적') {
      return <DonationPage />;
    }

    if (currentSubmenu === '공지사항' || currentSubmenu === '사경원 뉴스') {
      return <NoticePage />;
    }

    const awardSubmenus = [
      '분야별 응모 및 시상 기준', 
      '포상제도 운영 일정', 
      '포상 갤러리', 
      '포상제도', 
      'SRMQ포상'
    ];
    
    if (awardSubmenus.includes(currentSubmenu)) {
      return <AwardPage />;
    }

    if (
      currentSubmenu.includes('진단') || 
      currentSubmenu.includes('평가') ||
      currentMenu === 'evaluation' ||
      currentMenu === '진단/평가'
    ) {
      return <EvaluationPage />;
    }

    if (
      currentSubmenu.includes('발전방향') || 
      currentSubmenu.includes('FUTURE') ||
      currentSubmenu === 'SRMQ명예의전당' ||
      currentSubmenu.includes('방향')
    ) {
      return <FuturePage />;
    }

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