import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceWizardStore } from '../../store/workspaceWizardStore';
// 💡 [수정] 아이콘 목록에 VscCheck, VscSparkle 추가
import { VscFolder, VscAccount, VscOrganization, VscCopy, VscClose, VscCheck, VscSparkle } from "react-icons/vsc";
import PathSelectionModal from './PathSelectionModal';

export default function Workspace() {
  const navigate = useNavigate();
  
  const { 
    wsName, wsDesc, wsPath, wsType, 
    invitedEmails, setData, setStep, addEmail, removeEmail, reset 
  } = useWorkspaceWizardStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  
  // 💡 [추가] 자료 재배치 UI 토글용 껍데기 상태
  const [useRelocation, setUseRelocation] = useState(false);

  const handlePathSelect = (selectedPath) => {
    setData({ wsPath: selectedPath });
    setIsModalOpen(false);
  };

  const handleNext = () => {
    if (!wsName.trim()) return alert("워크스페이스 이름을 입력해주세요.");
    if (!wsType) return alert("워크스페이스 종류(개인/팀)를 선택해주세요.");
    setStep(2);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-4 select-none">
      
      <PathSelectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={handlePathSelect} 
      />

      <div className="space-y-5">
        <div>
          <label className="block text-[14px] font-bold text-gray-800 mb-2">워크스페이스 이름(J)</label>
          <input 
            value={wsName} 
            onChange={e => setData({wsName: e.target.value})} 
            className="w-full bg-[#f8f9fa] border border-gray-200 focus:border-blue-500 px-5 py-3.5 rounded-2xl outline-none text-[14px] text-gray-900 transition-all" 
            placeholder="예: MyProject" 
          />
        </div>

        <div>
          <label className="block text-[14px] font-bold text-gray-800 mb-2">워크스페이스 설명</label>
          <input 
            value={wsDesc} 
            onChange={e => setData({wsDesc: e.target.value})} 
            className="w-full bg-[#f8f9fa] border border-gray-200 focus:border-blue-500 px-5 py-3.5 rounded-2xl outline-none text-[14px] text-gray-900 transition-all" 
            placeholder="워크스페이스에 대한 설명을 적어주세요" 
          />
        </div>

        <div>
          <label className="block text-[14px] font-bold text-gray-800 mb-2">위치(L)</label>
          <div className="flex gap-2">
            <input 
              value={wsPath} 
              readOnly 
              className="flex-1 bg-[#f8f9fa] border border-gray-200 px-5 py-3.5 rounded-2xl text-gray-700 font-mono text-[13px] outline-none shadow-inner" 
            />
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-5 bg-blue-600 border border-blue-700 rounded-2xl hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center group"
              title="경로 선택"
            >
              <VscFolder size={22} className="text-white group-hover:text-yellow-300 transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="sameDir" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
          <label htmlFor="sameDir" className="text-[14px] font-semibold text-gray-700 cursor-pointer">
            솔루션 및 프로젝트를 같은 디렉터리에 배치(D)
          </label>
        </div>
        <p className="text-[12px] text-gray-500 font-medium ml-1 italic leading-tight">
          "{wsPath}\{wsName || 'project'}"에 프로젝트가 만들어집니다.
        </p>

        {/* 💡 [추가] 자료 재배치 더미 버튼 (UI 껍데기) */}
        <div className="pt-2">
          <div 
            onClick={() => setUseRelocation(!useRelocation)}
            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 select-none ${
              useRelocation 
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
              : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${
                useRelocation ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-300'
              }`}>
                {useRelocation && <VscCheck size={14} strokeWidth={1} />}
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-[14px] font-extrabold flex items-center gap-1.5 transition-colors ${useRelocation ? 'text-blue-800' : 'text-gray-700'}`}>
                <VscSparkle className={useRelocation ? "text-blue-600 animate-pulse" : "text-gray-400"} size={16} />
                자료 재배치를 하시겠습니까?
              </span>
              <span className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                워크스페이스 생성 시 AI가 프로젝트 구조를 분석하여 가상 뷰를 미리 만들어둡니다.
              </span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-6 pt-2">
        <div 
          onClick={() => setData({wsType: 'personal'})} 
          className={`border-2 rounded-[28px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${wsType === 'personal' ? 'border-blue-500 bg-blue-50/20 shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
        >
          <div className="w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center text-blue-500 mb-4 shadow-sm">
            <VscAccount size={28} />
          </div>
          <h3 className="font-extrabold text-gray-900 text-[15px] mb-1">개인 워크스페이스 생성</h3>
          <p className="text-[12px] font-medium text-gray-500 text-center leading-relaxed">혼자서 빠르게 프로젝트를 시작해보세요</p>
        </div>

        <div 
          onClick={() => setData({wsType: 'team'})} 
          className={`border-2 rounded-[28px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${wsType === 'team' ? 'border-green-500 bg-green-50/20 shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
        >
          <div className="w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm">
            <VscOrganization size={28} />
          </div>
          <h3 className="font-extrabold text-gray-900 text-[15px] mb-1">팀 워크스페이스 생성</h3>
          <p className="text-[12px] font-medium text-gray-500 text-center px-2 leading-relaxed">팀원들과 함께 협업 프로젝트를 시작해보세요</p>
        </div>
      </div>

      {wsType === 'team' && (
        <div className="mt-4 space-y-6 animate-fade-in border-t border-gray-200 pt-8">
          <h4 className="font-bold text-gray-900 text-[14px] uppercase tracking-wider mb-2">팀원 초대</h4>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">프로젝트에 초대할 팀원의 이메일을 입력하세요</label>
            <div className="flex gap-2">
              <input 
                value={emailInput} 
                onChange={e => setEmailInput(e.target.value)} 
                onKeyDown={(e) => { if(e.key === 'Enter' && emailInput) { addEmail(emailInput); setEmailInput(""); } }}
                className="flex-1 bg-[#f8f9fa] border border-gray-300 px-4 py-3 rounded-xl outline-none text-[14px] text-gray-900 focus:border-blue-500 transition-colors" 
                placeholder="teammate@example.com (엔터로 추가 가능)" 
              />
              <button 
                onClick={() => { if(emailInput) { addEmail(emailInput); setEmailInput(""); } }} 
                className="px-6 font-bold text-gray-700 bg-[#f8f9fa] border border-gray-300 rounded-xl hover:bg-gray-200 hover:text-black transition-colors"
              >
                + 추가
              </button>
            </div>
            {invitedEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {invitedEmails.map((email, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[12px] font-bold rounded-full border border-blue-200 shadow-sm animate-fade-in flex items-center gap-1.5">
                    {email}
                    <button 
                      onClick={() => removeEmail(email)} 
                      className="text-blue-400 hover:text-red-500 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                      title="삭제"
                    >
                      <VscClose size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-[14px] uppercase tracking-wider mb-2">프로젝트 키</h4>
            <div className="flex gap-2">
              <input readOnly value="PROJ-4K9L-M2X7" className="flex-1 bg-[#f8f9fa] border border-gray-300 px-4 py-3 rounded-xl text-gray-600 font-mono text-[14px] outline-none" />
              <button className="px-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 transition-all shadow-sm">
                <VscCopy size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-10 pb-6">
        <button 
          onClick={() => {
            reset();          
            navigate('/');   
          }} 
          className="px-10 py-3.5 bg-white border border-gray-300 text-gray-700 font-bold text-[15px] rounded-[20px] hover:bg-gray-50 transition-all"
        >
          뒤로(B)
        </button>
        <button 
          onClick={handleNext} 
          disabled={!wsName || !wsType}
          className={`px-12 py-3.5 font-bold text-[15px] rounded-[20px] shadow-md transition-all ${
            wsName && wsType 
            ? 'bg-gray-900 text-white hover:bg-black active:scale-95' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border border-gray-300'
          }`}
        >
          다음(C)
        </button>
      </div>
    </div>
  );
}