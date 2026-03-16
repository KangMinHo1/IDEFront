import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceWizardStore } from '../../store/workspaceWizardStore';
import { createWorkspaceApi, createProjectInWorkspaceApi, inviteWorkspaceMemberApi } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';

export default function Config() {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const { 
    wsName, wsPath, wsType, language, 
    projName, projDesc, gitRepo, 
    invitedEmails, 
    setData, setStep, reset 
  } = useWorkspaceWizardStore();
  
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    let targetId = `local-${Date.now()}`;
    
    try {
      // 💡 [버그 수정 1] 워크스페이스 타입을 정확하게 판별해서 API로 넘겨줍니다!
      const finalType = wsType === 'team' ? 'TEAM' : 'PERSONAL';
      const res = await createWorkspaceApi(wsName, wsPath, user.id, finalType);
      
      targetId = res.workspaceId || res.uuid || res.id || targetId;
      
      // 2. 프로젝트 생성
      await createProjectInWorkspaceApi(targetId, projName || wsName, language, projDesc, gitRepo);

      // 3. 팀 워크스페이스이고 초대할 이메일이 있다면 초대 발송
      if (wsType === 'team' && invitedEmails.length > 0) {
          const invitePromises = invitedEmails.map(email => inviteWorkspaceMemberApi(targetId, email));
          await Promise.allSettled(invitePromises);
          console.log(`📧 ${invitedEmails.length}명의 팀원에게 초대를 발송했습니다.`);
      }

    } catch (e) {
      console.warn("API 미연결 또는 오류: 강제 진입 모드", e);
    } finally {
      setLoading(false);
      reset();
      
      if (wsType === 'team') {
          const teamList = JSON.parse(localStorage.getItem('teamWorkspaces') || '[]');
          if (!teamList.includes(targetId)) {
              teamList.push(targetId);
              localStorage.setItem('teamWorkspaces', JSON.stringify(teamList));
          }
          navigate(`/workspace/team/${targetId}`);
      } else {
          navigate(`/workspace/personal/${targetId}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-4 select-none">
      <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 font-bold text-[13px] rounded-lg w-fit shadow-sm">
        {language || "Java"}
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[14px] font-bold text-gray-800 mb-2">프로젝트 이름(J)</label>
          <input 
            value={projName} 
            onChange={e => setData({projName: e.target.value})} 
            className="w-full bg-[#f8f9fa] border border-gray-200 focus:border-blue-500 px-5 py-3.5 rounded-2xl outline-none text-[14px] text-gray-900 transition-all" 
            placeholder="예: 내 첫 프로젝트" 
          />
        </div>

        <div>
          <label className="block text-[14px] font-bold text-gray-800 mb-2">프로젝트 설명</label>
          <input 
            value={projDesc} 
            onChange={e => setData({projDesc: e.target.value})} 
            className="w-full bg-[#f8f9fa] border border-gray-200 focus:border-blue-500 px-5 py-3.5 rounded-2xl outline-none text-[14px] text-gray-900 transition-all" 
            placeholder="프로젝트에 대한 설명을 적어주세요" 
          />
        </div>

        <hr className="border-gray-100 my-8" />

        <div>
          <label className="block text-[15px] font-extrabold text-gray-800 mb-2">GitHub 저장소 (선택사항)</label>
          <p className="text-[13px] font-bold text-gray-500 mb-4">기존 GitHub 저장소와 연결하거나 비워두고 나중에 연결할 수 있습니다</p>
          <input 
            value={gitRepo} 
            onChange={e => setData({gitRepo: e.target.value})} 
            className="w-full bg-[#f8f9fa] border border-gray-200 focus:border-blue-500 px-5 py-3.5 rounded-2xl outline-none text-[14px] text-gray-900 transition-all" 
            placeholder="https://github.com/username/repository" 
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-10 pb-6">
        <button onClick={() => setStep(2)} className="px-10 py-3.5 bg-white border border-gray-300 text-gray-700 font-bold text-[15px] rounded-[20px] hover:bg-gray-50 transition-all">뒤로(B)</button>
        <button onClick={handleFinish} disabled={loading} className="px-12 py-3.5 bg-gray-900 text-white font-bold text-[15px] rounded-[20px] shadow-md hover:bg-black active:scale-95 disabled:bg-gray-400 transition-all">
          {loading ? "생성 중..." : "만들기(C)"}
        </button>
      </div>
    </div>
  );
}