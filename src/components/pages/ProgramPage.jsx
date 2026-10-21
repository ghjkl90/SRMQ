import React, { useState, useEffect } from 'react';
import './ProgramPage.css';

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
    <div className="program-container">

      {/* 상단 로고 및 타이틀 영역 */}
      <div className="program-header">
        <h1 className="program-title">
          사회적책임경영품질원
        </h1>
        <p className="program-subtitle">
          Social Responsibility & Management Quality Institute
        </p>
        <p className="program-desc">
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      {/* 중앙 사진 슬라이더 영역 */}
      <div className="program-slider">
        <div
          className="program-slider-track"
          style={{
            width: `${heroImages.length * 100}%`,
            transform: `translateX(-${(currentIndex * 100) / heroImages.length}%)`,
          }}
        >
          {heroImages.map((imgName, index) => (
            <div
              key={index}
              className="program-slide"
              style={{
                width: `${100 / heroImages.length}%`,
                backgroundImage: `url(${getImgSrc(imgName)})`,
              }}
            />
          ))}
        </div>

        {/* 하단 인디케이터 (점 4개) */}
        <div className="program-dots">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1}번째 사진 보기`}
              onClick={() => setCurrentIndex(index)}
              className={`program-dot ${index === currentIndex ? 'is-active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 하단 법적 고지 및 웹사이트 주소 */}
      <div className="program-footer">
        <span>기획재정부 승인 비영리법인</span>
        <span>www.srmq.or.kr</span>
      </div>

    </div>
  );
}
