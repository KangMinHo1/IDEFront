// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import IdeMain from './components/IdeMain';
// 💡 방금 생성한 자료 재배치 컴포넌트 임포트
import ResourceRelocation from './pages/ResourceRelocation'; // 만약 components 폴더에 만드셨다면 경로를 바꿔주세요!

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 기존 대시보드 (목록) */}
        <Route path="/" element={<Dashboard />} />
        
        {/* 기존 에디터 (특정 워크스페이스 진입) */}
        <Route path="/workspace/:id" element={<IdeMain />} />

        {/* ============================================================== */}
        {/* 💡 [추가됨] 자료 재배치 라우트 설정 */}
        {/* ============================================================== */}
        <Route path="/relocation" element={<ResourceRelocation />} />
        <Route path="/relocation/:id" element={<ResourceRelocation />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;