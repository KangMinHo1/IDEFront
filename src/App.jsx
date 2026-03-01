import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import IdeMain from './components/IdeMain';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 대시보드 (목록) */}
        <Route path="/" element={<Dashboard />} />
        
        {/* 에디터 (특정 워크스페이스 진입) */}
        <Route path="/workspace/:id" element={<IdeMain />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;