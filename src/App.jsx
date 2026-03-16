import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext.jsx'; 
import { useWorkspaceWizardStore } from './store/workspaceWizardStore';

import Login from './pages/Login.jsx'; // 💡 새로 만든 로그인 페이지 임포트
import Workspace from './components/new/Workspace.jsx';
import Language from './components/new/Language.jsx';
import Config from './components/new/Config.jsx';
import Dashboard from './components/Dashboard.jsx';

import IdeMain from './components/IdeMain.jsx';
import TeamIdeMain from './components/TeamIdeMain.jsx';
import ResourceRelocation from './pages/ResourceRelocation.jsx';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  // 💡 로그인이 안 되어있으면 무조건 로그인 페이지로 튕겨냅니다!
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function NewWizardShell() {
  const { step } = useWorkspaceWizardStore();
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex justify-center items-start py-10 font-sans overflow-hidden">
      <div className="w-full max-w-5xl flex gap-10 px-6 h-[85vh]">
        <div className="w-56 shrink-0 pt-4">
          <h2 className="text-xl font-bold text-gray-300 mb-1 tracking-tight">
            {step === 1 && "워크스페이스 생성"}
            {step === 2 && "언어 선택"}
            {step === 3 && "새 프로젝트 구성"}
          </h2>
          <p className="text-[13px] text-gray-500 font-medium">
            {step === 1 && "워크스페이스를 생성하세요"}
            {step === 2 && "프로젝트 언어를 선택하세요"}
            {step === 3 && "프로젝트 세부 설정을 완료하세요"}
          </p>
        </div>
        <div className="flex-1 bg-white border border-gray-100 rounded-[32px] shadow-sm flex flex-col overflow-hidden p-12">
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {step === 1 && <Workspace />}
              {step === 2 && <Language />}
              {step === 3 && <Config />}
           </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 💡 로그인 페이지 라우트 추가 */}
        <Route path="/login" element={<Login />} />
        
        {/* 💡 이제 대시보드도 ProtectedRoute로 감쌉니다! */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><NewWizardShell /></ProtectedRoute>} />
        
        <Route path="/workspace/personal/:id" element={<ProtectedRoute><IdeMain /></ProtectedRoute>} />
        <Route path="/workspace/team/:id" element={<ProtectedRoute><TeamIdeMain /></ProtectedRoute>} />
        
        <Route path="/rearrange" element={<ProtectedRoute><ResourceRelocation /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;