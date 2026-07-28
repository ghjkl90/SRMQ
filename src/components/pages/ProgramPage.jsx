import React from 'react';
import heroImg from '../../assets/hero.png'; // 👈 에셋 폴더의 실제 이미지 불러오기

export default function CoverPage() {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '56px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* 상단 로고 및 타이틀 영역 */}
      <div>
        <div style={{ width: '56px', height: '56px', backgroundColor: '#82C91E', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '28px', fontWeight: 'bold', marginBottom: '36px', boxShadow: '0 4px 6px -1px rgba(130, 201, 30, 0.3)' }}>
          Q
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 12px 0', lineHeight: '1.2' }}>
          사회책임경영품질원
        </h1>
        <p style={{ fontSize: '20px', fontWeight: '600', color: '#82C91E', margin: '0 0 28px 0' }}>
          Social Responsibility & Management Quality Institute
        </p>
        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: 0, maxWidth: '600px' }}>
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      {/* 중앙 사진 목업 (피그마 Mask group 비율 및 에셋 이미지 적용) */}
      <div 
        style={{ 
          width: '100%', 
          height: '340px', 
          borderRadius: '14px', 
          backgroundImage: `url(${heroImg})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
          margin: '20px 0'
        }}
      ></div>

      {/* 하단 법적 고지 및 웹사이트 주소 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
        <span>기획재정부 승인 비영리법인</span>
        <span>www.srmq.or.kr</span>
      </div>

    </div>
  );
}