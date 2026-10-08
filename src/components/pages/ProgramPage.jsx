import React from 'react';
import heroImg from '../../assets/purpose.png'; 

export default function CoverPage() {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* 상단 로고 및 타이틀 영역 */}
      <div>
        <h1 style={{ fontSize: '56px', fontWeight: '700', color: '#111827', margin: '80px 0 8px 0', lineHeight: '1.2' }}>
          사회책임경영품질원
        </h1>
        <p style={{ fontSize: '26px', fontWeight: '600', color: '#82C91E', margin: '0 0 20px 0' }}>
          Social Responsibility & Management Quality Institute
        </p>
        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', margin: 0, maxWidth: '700px' }}>
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      {/* 중앙 사진 목업 */}
      <div 
        style={{ 
          width: '100%', 
          height: '480px', 
          backgroundImage: `url(${heroImg})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
          margin: '16px 0'
        }}
      ></div>

      {/* 하단 법적 고지 및 웹사이트 주소 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
        <span>기획재정부 승인 비영리법인</span>
        <span>www.srmq.or.kr</span>
      </div>

    </div>
  );
}