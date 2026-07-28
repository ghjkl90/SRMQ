import React, { useState } from 'react';
import Header from './components/Header';
import CoverPage from './components/pages/CoverPage';
import GreetingPage from './components/pages/GreetingPage';
import VisionPage from './components/pages/VisionPage'; // 어디다 둘지 생각 안 했음
import PurposePage from './components/pages/PurposePage'; // 어디다 둘지 생각 안 했음

export default function App() {
  const [currentMenu, setCurrentMenu] = useState('home');
  const [currentSubmenu, setCurrentSubmenu] = useState('표지');

  const handleSelectSubmenu = (menuId, subLabel) => {
    setCurrentMenu(menuId);
    setCurrentSubmenu(subLabel);
  };

  const renderContent = () => {
    if (currentMenu === 'home') {
      if (currentSubmenu === '인사말') {
        return <GreetingPage />;
      }
      if (currentSubmenu === '설립목적') {
        return <PurposePage />; 
      }
      return <CoverPage />;
    }

    if (currentSubmenu === '인사말') {
      return <GreetingPage />;
    }
    if (currentSubmenu === '설립목적') {
      return <PurposePage />;
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