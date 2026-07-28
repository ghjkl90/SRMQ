import React from 'react';
import { IMAGES } from '../../assets/images'; // 👈 이미지 파일 임포트

export default function CoverPage() {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="w-12 h-12 bg-lime-500 rounded-xl flex items-center justify-center text-white font-title mb-6 shadow-md">
          Q
        </div>
        <h1 className="font-title text-gray-900 mb-2">사회책임경영품질원</h1>
        <p className="font-subtitle text-lime-600 mb-8">Social Responsibility & Management Quality Institute</p>
        <p className="font-body text-gray-600">
          기업과 조직이 신뢰와 존중을 바탕으로 지속가능한 발전을 이룰 수 있도록, 사회적 책임과 선진 경영문화를 널리 보급합니다.
        </p>
      </div>

      <div className="w-full h-72 bg-gradient-to-br from-emerald-50 to-lime-50 rounded-xl border border-lime-200 flex items-center justify-center relative overflow-hidden shadow-inner">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80" 
          style={{ backgroundImage: `url('${IMAGES.coverPlant}')` }} // 👈 중앙 관리되는 이미지 삽입
        ></div>
        <div className="absolute inset-0 bg-lime-900/10"></div>
        <span className="relative z-10 font-subtitle text-white bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
          지속가능경영 상징 목업
        </span>
      </div>

      <div className="flex justify-between items-center text-gray-400 font-caption pt-4 border-t border-gray-100">
        <span>기획재정부 승인 비영리법인</span>
        <span>www.srmq.or.kr</span>
      </div>
    </div>
  );
}