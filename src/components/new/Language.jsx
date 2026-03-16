import React from 'react';
import { useWorkspaceWizardStore } from '../../store/workspaceWizardStore';
import { VscSearch } from "react-icons/vsc";

export default function Language() {
  const { language, setData, setStep } = useWorkspaceWizardStore();
  
  // 이미지와 동일한 언어 리스트
  const langs = [
    { name: 'Java', icon: '☕' },
    { name: 'JavaScript', icon: '📜' },
    { name: 'HTML', icon: '🌐' },
    { name: 'C', icon: '©️' },
    { name: 'C++', icon: '⚙️' },
    { name: 'C#', icon: '🎯' }
  ];

  return (
    <div className="flex gap-8 animate-fade-in h-[500px]">
      {/* 💡 좌측: 최근 이용한 언어 (가시성 개선) */}
      <div className="w-56 shrink-0 border border-gray-200 rounded-[24px] p-6 bg-white h-fit shadow-sm">
        <h3 className="font-bold text-gray-400 text-[13px] mb-5 uppercase tracking-wider">최근 이용한 언어</h3>
        <div className="space-y-3">
          {['JavaScript', 'Python', 'TypeScript'].map(l => (
            <div key={l} className="border border-gray-100 px-4 py-3 rounded-xl text-[13px] text-gray-500 font-bold bg-gray-50/50">
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* 💡 우측: 언어 선택 메인 (대비 강화) */}
      <div className="flex-1 border border-gray-200 rounded-[24px] p-8 bg-white shadow-sm flex flex-col relative">
        <div className="flex justify-between items-center mb-6">
          <label className="font-bold text-gray-800 text-sm">
            언어 선택 <span className="text-red-500">*</span>
          </label>
          <div className="w-1/2 flex items-center border border-gray-300 rounded-xl px-4 py-2 bg-white focus-within:border-blue-400 transition-colors">
            <input 
              className="w-full outline-none text-[13px] text-gray-700 placeholder-gray-400" 
              placeholder="검색" 
            />
            <VscSearch className="text-gray-500" />
          </div>
        </div>

        {/* 언어 리스트: 선택 시 파란색 강조 확실히 */}
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar pb-20">
          {langs.map(l => (
            <div 
              key={l.name} 
              onClick={() => setData({language: l.name})} 
              className={`flex items-center gap-4 px-6 py-4 border rounded-2xl cursor-pointer transition-all ${
                language === l.name 
                ? 'border-blue-400 bg-blue-50/50 shadow-sm' 
                : 'border-gray-100 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="text-xl">{l.icon}</span>
              <span className={`text-[15px] font-bold ${language === l.name ? 'text-blue-700' : 'text-gray-700'}`}>
                {l.name}
              </span>
            </div>
          ))}
        </div>

        {/* 하단 버튼: 이미지와 동일한 명도 */}
        <div className="absolute bottom-8 right-8 flex gap-3 bg-white pl-4">
          <button 
            onClick={() => setStep(1)} 
            className="px-8 py-2.5 text-gray-500 font-bold text-[15px] hover:text-gray-800 transition-colors"
          >
            뒤로(B)
          </button>
          <button 
            onClick={() => language && setStep(3)} 
            className={`px-10 py-2.5 font-bold text-[15px] rounded-[18px] shadow-sm transition-all ${
              language 
              ? 'bg-gray-800 text-white hover:bg-black' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            다음(N)
          </button>
        </div>
      </div>
    </div>
  );
}