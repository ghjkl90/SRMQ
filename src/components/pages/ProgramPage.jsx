import React, { useState, useEffect } from 'react';

// assets 폴더 내의 main_page 관련 이미지들을 동적으로 불러옵니다.
const images = import.meta.glob('../../assets/main_page*.png', { eager: true });

const getImgSrc = (fileName) => {
  const match = Object.keys(images).find((path) => path.endsWith(`/${fileName}`));
  return match ? images[match].default : '';
};

// 사용할 이미지 목록
const heroImages = [
  'main_page.png',
  'main_page2.png',
  'main_page3.png',
  'main_page4.png',
];

export default function CoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* 상단 로고 및 타이틀 영역 */}
      <div>
        <h1 style={{ fontSize: '56px', fontWeight: '700', color: '#111827', margin: '80px 0 8px 0', lineHeight: '1.2' }}>
          사회적책임경영품질원
        </h1>
        <p style={{ fontSize: '26px', fontWeight: '600', color: '#82C91E', margin: '0 0 20px 0' }}>
          Social Responsibility & Management Quality Institute
        </p>
        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', margin: 0, maxWidth: '700px' }}>
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      {/* 중앙 사진 슬라이더 영역 */}
      <div style={{ position: 'relative', width: '100%', height: '480px', margin: '16px 0', overflow: 'hidden' }}>
        <div 
          style={{ 
            display: 'flex', 
            width: `${heroImages.length * 100}%`, 
            height: '100%', 
            transform: `translateX(-${(currentIndex * 100) / heroImages.length}%)`, 
            transition: 'transform 0.6s ease-in-out' 
          }}
        >
          {heroImages.map((imgName, index) => (
            <div
              key={index}
              style={{
                width: `${100 / heroImages.length}%`,
                height: '100%',
                backgroundImage: `url(${getImgSrc(imgName)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
              }}
            />
          ))}
        </div>

        {/* 하단 인디케이터 (점 4개) */}
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: index === currentIndex ? '#82C91E' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* 하단 법적 고지 및 웹사이트 주소 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
        <span>기획재정부 승인 비영리법인</span>
        <span>www.srmq.or.kr</span>
      </div>

    </div>
  );
}