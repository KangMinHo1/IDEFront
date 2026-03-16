import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import MenuBar from './MenuBar';
import ActivityBar from './ActivityBar';
import Sidebar from './Sidebar';
import CodeEditor from './CodeEditor';
import BottomPanel from './BottomPanel';
import FileTabs from './FileTabs';
import DebugPanel from './DebugPanel';
import AgentPanel from './AgentPanel';
import CreateProjectModal from './CreateProjectModal'; 
import CommandPalette from './CommandPalette';
import GitDashboard from './GitDashboard'; 
import CodeMap from './CodeMap'; 

import { fetchWorkspaceProjectsApi } from '../utils/api'; 
import { setWorkspaceTree, setWorkspaceId, setProjectList } from '../store/slices/fileSystemSlice'; 
import { VscClose, VscWand } from 'react-icons/vsc';

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white font-bold">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white font-bold">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white font-bold">My Page Panel</div>;

export default function IdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { activeActivity, isTerminalVisible, isSidebarVisible, isAgentVisible, isDebugMode, codeMapMode } = useSelector(state => state.ui);
  const { workspaceId, activeProject } = useSelector(state => state.fileSystem);
  const isCodeMapSplit = codeMapMode === 'split';

  useEffect(() => {
    if (id) {
      dispatch(setWorkspaceId(id));
      fetchWorkspaceProjectsApi(id).then(root => {
        dispatch(setWorkspaceTree(root));
        if (root.children) dispatch(setProjectList(root.children));
      }).catch(console.error);
    }
  }, [id, dispatch]);

  const renderMainContent = () => {
    switch (activeActivity) {
        case 'docs': return <DocsPanel />;
        case 'api-test': return <ApiTestPanel />;
        case 'mypage': return <MyPagePanel />;
        case 'git': return <GitDashboard />;
        case 'editor':
        default:
            return (
                <div className="flex-1 flex overflow-hidden">
                    {/* 좌측 사이드바 */}
                    {isSidebarVisible && (
                        <div className="w-[260px] shrink-0 border-r border-gray-200 flex flex-col bg-[#f8f9fa]">
                           <Sidebar />
                        </div>
                    )}
                    
                    {/* 중앙 에디터 영역 */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        <FileTabs />
                        <div className="flex-1 flex relative overflow-hidden">
                            <div className="flex-1 flex flex-col min-w-0">
                                <CodeEditor />
                            </div>
                            {isCodeMapSplit && (
                                <div className="w-1/2 border-l border-gray-200 flex flex-col z-10">
                                    <CodeMap />
                                </div>
                            )}
                        </div>
                        {isTerminalVisible && (
                            <div className="h-[250px] border-t border-gray-200 bg-white shrink-0">
                                <BottomPanel />
                            </div>
                        )}
                    </div>

                    {/* 우측 패널 (비율 고정: w-[320px]) */}
                    {(isAgentVisible || isDebugMode) && (
                        <div className="w-[320px] shrink-0 border-l border-gray-200 flex flex-col bg-[#f8f9fa] z-20">
                            {isDebugMode ? <DebugPanel /> : <AgentPanel />}
                        </div>
                    )}
                </div>
            );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-[#333] overflow-hidden font-sans relative">
      <CommandPalette />
      <CreateProjectModal /> 
      <MenuBar mode="personal" />
      <div className="flex-1 flex overflow-hidden">
          <ActivityBar />
          {renderMainContent()}
      </div>
    </div>
  );
}