import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscFolder, VscSearch, VscAccount, VscOrganization, VscCopy } from "react-icons/vsc";
import { createWorkspaceApi, createProjectInWorkspaceApi } from '../utils/api';

export default function CreateWorkspace() {
  const navigate = useNavigate();

  // 💡 이미지와 동일한 3단계 마법사 구성
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // [Step 1] 상태
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsPath, setWsPath] = useState("C:\\Users\\user\\source\\repos");
  const [isSameDir, setIsSameDir] = useState(false);
  const [wsType, setWsType] = useState(null); // 'personal' | 'team'
  
  // [Team 전용]
  const [teamEmail, setTeamEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);
  const projectKey = "PROJ-4K9L-M2X7";

  // [Step 2] 언어
  const [language, setLanguage] = useState("");
  const [searchLang, setSearchLang] = useState("");

  // [Step 3] 프로젝트 상세
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [gitRepo, setGitRepo] = useState("");

  const languages = [
    { id: 'Java', name: 'Java', icon: '☕' },
    { id: 'JavaScript', name: 'JavaScript', icon: '📜' },
    { id: 'HTML', name: 'HTML', icon: '🌐' },
    { id: 'C', name: 'C', icon: '©️' },
    { id: 'C++', name: 'C++', icon: '⚙️' },
    { id: 'C#', name: 'C#', icon: '🎯' },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!wsName) return alert("워크스페이스 이름을 입력해주세요.");
      if (!wsType) return alert("워크스페이스 종류를 선택해주세요.");
      setStep(2);
    } else if (step === 2) {
      if (!language) return alert("언어를 선택해주세요.");
      setProjName(wsName); 
      setStep(3);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    let targetId = `local-${Date.now()}`;
    try {
      const wsRes = await createWorkspaceApi(wsName, wsPath, "user1");
      targetId = wsRes.workspaceId || wsRes.uuid || wsRes.id || targetId;
      await createProjectInWorkspaceApi(targetId, projName, language, projDesc, gitRepo);
    } catch (e) {
      console.warn("⚠️ 껍데기 모드로 에디터 진입");
    } finally {
      setLoading(false);
      navigate(`/workspace/${targetId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col p-12 font-sans overflow-auto">
      
      {/* 💡 이미지 왼쪽 상단과 동일한 연한 타이틀 위치 */}
      <div className="max-w-[900px] mx-auto w-full mb-6">
        {step === 1 && (
          <div className="animate-fade-in select-none">
            <h2 className="text-[18px] font-bold text-gray-200 tracking-tight leading-none">워크스페이스 생성</h2>
            <p className="text-[18px] font-bold text-gray-300 mt-1">워크스페이스를 생성하세요</p>
          </div>
        )}
        {step === 2 && (
          <div className="animate-fade-in select-none">
            <h2 className="text-[18px] font-bold text-gray-200 tracking-tight leading-none">언어 선택</h2>
            <p className="text-[18px] font-bold text-gray-300 mt-1">프로젝트 언어를 선택하세요</p>
          </div>
        )}
        {step === 3 && (
          <div className="animate-fade-in select-none">
            <h2 className="text-[18px] font-bold text-gray-200 tracking-tight leading-none">새 프로젝트 구성</h2>
            <p className="text-[18px] font-bold text-gray-300 mt-1">프로젝트 세부 설정을 완료하세요</p>
          </div>
        )}
      </div>

      {/* 💡 이미지 중앙 하얀색 카드 레이아웃 */}
      <div className="max-w-[900px] mx-auto w-full bg-white border border-gray-200 rounded-[24px] p-12 shadow-sm relative min-h-[650px] flex flex-col">
        
        {step === 1 && (
          <div className="flex-1 space-y-6 animate-fade-in">
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">워크스페이스 이름(J)</label>
              <input value={wsName} onChange={e => setWsName(e.target.value)} className="w-full bg-[#f8f9fa] border border-transparent focus:border-gray-200 px-4 py-3 rounded-xl outline-none text-[14px] text-gray-600 placeholder-gray-100" placeholder="56655" />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">워크스페이스 설명</label>
              <input value={wsDesc} onChange={e => setWsDesc(e.target.value)} className="w-full bg-[#f8f9fa] border border-transparent focus:border-gray-200 px-4 py-3 rounded-xl outline-none text-[14px] text-gray-600 placeholder-gray-100" placeholder="56655" />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-gray-700 mb-2">위치(L)</label>
              <div className="flex gap-2">
                <input value={wsPath} readOnly className="flex-1 bg-[#f8f9fa] border border-transparent px-4 py-3 rounded-xl text-[14px] text-gray-200 font-medium outline-none" />
                <button className="px-4 border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50"><VscFolder size={18} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sameDir" checked={isSameDir} onChange={e => setIsSameDir(e.target.checked)} className="w-4 h-4 border-gray-300 rounded" />
              <label htmlFor="sameDir" className="text-[14px] font-semibold text-gray-700">솔루션 및 프로젝트를 같은 디렉터리에 배치(D)</label>
            </div>
            <p className="text-[13px] text-gray-400 font-medium">"{wsPath}\{wsName || '56655'}\{wsName || '56655'}"에 프로젝트가 만들어집니다.</p>

            {/* 개인/팀 선택 영역 */}
            <div className="grid grid-cols-2 gap-6 pt-6">
              <div onClick={() => setWsType('personal')} className={`border rounded-[20px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${wsType === 'personal' ? 'ring-2 ring-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="w-14 h-14 bg-white border border-gray-50 rounded-full flex items-center justify-center text-blue-500 mb-4 shadow-sm"><VscAccount size={26} /></div>
                <h3 className="font-extrabold text-gray-900 text-[15px] mb-1">개인 워크스페이스 생성</h3>
                <p className="text-[13px] text-gray-500 text-center font-medium">혼자서 빠르게 프로젝트를 시작해보세요</p>
              </div>
              <div onClick={() => setWsType('team')} className={`border rounded-[20px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${wsType === 'team' ? 'ring-2 ring-green-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="w-14 h-14 bg-white border border-gray-50 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm"><VscOrganization size={26} /></div>
                <h3 className="font-extrabold text-gray-900 text-[15px] mb-1">팀 워크스페이스 생성</h3>
                <p className="text-[13px] text-gray-500 text-center font-medium px-4 leading-relaxed">팀원들과 함께 협업 프로젝트를 시작해보세요</p>
              </div>
            </div>

            {/* 팀 선택 시 나타나는 필드 (이미지 2) */}
            {wsType === 'team' && (
              <div className="space-y-5 pt-4 animate-fade-in">
                <h4 className="font-bold text-gray-100 text-[13px] uppercase tracking-wider">팀원 초대</h4>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">프로젝트에 초대할 팀원의 이메일을 입력하세요</label>
                  <div className="flex gap-2">
                    <input value={teamEmail} onChange={e => setTeamEmail(e.target.value)} className="flex-1 bg-[#f8f9fa] px-4 py-3 rounded-xl outline-none text-[14px]" placeholder="팀원의 이메일 주소" />
                    <button className="px-6 font-bold text-gray-300 bg-[#f8f9fa] rounded-xl hover:bg-gray-100">+ 추가</button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-100 text-[13px] uppercase tracking-wider mt-6">프로젝트 키</h4>
                <div className="flex gap-2">
                  <input readOnly value={projectKey} className="flex-1 bg-[#f8f9fa] px-4 py-3 rounded-xl text-gray-300 font-mono outline-none" />
                  <button className="px-4 border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50"><VscCopy size={18} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: 언어 선택 (이미지 3) */}
        {step === 2 && (
          <div className="flex-1 flex gap-8 animate-fade-in">
            <div className="w-[240px] border border-gray-100 rounded-2xl p-6 h-fit bg-white shadow-sm">
              <h3 className="font-extrabold text-gray-100 text-[13px] mb-5">최근 이용한 언어</h3>
              <div className="space-y-3">
                {['JavaScript', 'Python', 'TypeScript'].map(lang => (
                  <div key={lang} className="border border-gray-50 px-4 py-2.5 rounded-xl text-[13px] text-gray-200 font-bold">{lang}</div>
                ))}
              </div>
            </div>
            <div className="flex-1 border border-gray-100 rounded-2xl p-8 flex flex-col relative bg-white shadow-sm h-[450px]">
              <div className="flex justify-between items-center mb-6">
                <label className="font-extrabold text-gray-200 text-sm">언어 선택 <span className="text-red-400">*</span></label>
                <div className="w-1/2 flex items-center border border-gray-100 rounded-lg px-3 py-2"><input value={searchLang} onChange={e => setSearchLang(e.target.value)} className="w-full outline-none text-[13px] placeholder-gray-100" placeholder="검색" /><VscSearch className="text-gray-300" /></div>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {languages.filter(l => l.name.toLowerCase().includes(searchLang.toLowerCase())).map(lang => (
                  <div key={lang.id} onClick={() => setLanguage(lang.name)} className={`flex items-center gap-4 px-5 py-4 border rounded-xl cursor-pointer transition-all ${language === lang.name ? 'border-[#a8c7fa] bg-[#f0f4ff]' : 'border-gray-50 hover:border-gray-200'}`}><span className="text-xl opacity-80">{lang.icon}</span><span className={`text-[15px] font-extrabold ${language === lang.name ? 'text-gray-800' : 'text-gray-100'}`}>{lang.name}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: 프로젝트 상세 (이미지 4) */}
        {step === 3 && (
          <div className="flex-1 space-y-8 animate-fade-in">
             <div className="inline-block px-4 py-1.5 bg-[#f0f4ff] text-blue-500 font-bold text-sm rounded-lg mb-2">{language || "JavaScript"}</div>
             <div><label className="block text-[14px] font-bold text-gray-700 mb-2.5">프로젝트 이름(J)</label><input value={projName} onChange={e => setProjName(e.target.value)} className="w-full bg-[#f8f9fa] px-4 py-3.5 rounded-xl outline-none text-[14px]" placeholder="56655" /></div>
             <div><label className="block text-[14px] font-bold text-gray-700 mb-2.5">프로젝트 설명</label><input value={projDesc} onChange={e => setProjDesc(e.target.value)} className="w-full bg-[#f8f9fa] px-4 py-3.5 rounded-xl outline-none text-[14px]" placeholder="56655" /></div>
             <hr className="border-gray-50 my-8" />
             <div>
                <label className="block text-[15px] font-extrabold text-gray-100 mb-2">GitHub 저장소 (선택사항)</label>
                <p className="text-[13px] font-bold text-gray-500 mb-3">기존 GitHub 저장소와 연결하거나 비워두고 나중에 연결할 수 있습니다</p>
                <input value={gitRepo} onChange={e => setGitRepo(e.target.value)} className="w-full bg-[#f8f9fa] px-4 py-3.5 rounded-xl outline-none text-[14px]" placeholder="https://github.com/username/repository" />
             </div>
          </div>
        )}

        {/* 💡 이미지 1~4 하단과 동일한 버튼 배치 */}
        <div className="mt-auto pt-10 flex justify-end gap-3">
          <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="px-8 py-3 bg-white border border-gray-200 text-gray-200 font-bold text-[15px] rounded-xl hover:text-gray-400 transition-colors">뒤로(B)</button>
          {step < 3 ? (
            <button onClick={handleNext} className="px-8 py-3 bg-[#e5e7eb] text-gray-500 font-bold text-[15px] rounded-xl hover:bg-gray-300 transition-colors">다음(C)</button>
          ) : (
            <button onClick={handleCreate} disabled={loading} className="px-8 py-3 bg-[#e5e7eb] text-gray-500 hover:bg-gray-400 font-bold text-[15px] rounded-xl transition-colors">{loading ? "생성 중..." : "만들기(C)"}</button>
          )}
        </div>
      </div>
    </div>
  );
}