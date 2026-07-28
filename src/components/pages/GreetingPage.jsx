import React from 'react';

export default function GreetingPage() {
  return (
    <div className="flex flex-col justify-between h-full bg-[#0b4f4a] text-white -m-10 p-10">
      <div>
        <span className="bg-lime-500 text-white font-caption px-3 py-1 rounded mb-4 inline-block font-semibold">
          인사말 GREETING
        </span>
        <h2 className="font-title text-white mb-4 mt-2">
          책임 있는 경영이 지속가능한 미래를 만듭니다.
        </h2>
        <p className="font-body text-emerald-100 mb-4">
          AX 시대를 맞이하여 모든 조직의 경영환경은 급속히 변화하고 있습니다. 투명성 제고와 사회적책임의 실행, 품질과 기술의 혁신을 통해 지속가능한 성장을 이끕니다.
        </p>
      </div>

      <div className="w-full h-48 bg-slate-800 rounded-lg overflow-hidden relative shadow-lg">
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80')` }}></div>
        <div className="absolute bottom-4 left-4 font-subtitle text-white">
          회장 박성현 / (사)사회책임경영품질원
        </div>
      </div>

      <div className="flex justify-between items-center text-emerald-200 font-caption pt-4 border-t border-emerald-800">
        <span>사회책임경영품질원</span>
        <span>02</span>
      </div>
    </div>
  );
}