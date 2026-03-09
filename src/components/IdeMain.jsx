import React, { useEffect } from 'react';
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
import { setCodeMapMode } from '../store/slices/uiSlice'; 

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500">My Page Panel</div>;

export default function IdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { isSidebarVisible, isTerminalVisible, isAgentVisible, activeActivity, isDebugMode, codeMapMode } = useSelector(state => state.ui);
  const { openFiles, activeFileId } = useSelector(state => state.fileSystem);

  // 💡 가상 식별자로 변경 체크
  const isCodeMapTabOpen = openFiles.some(f => f.id === 'virtual:codemap');
  
  useEffect(() => {
      if (!isCodeMapTabOpen && codeMapMode !== null) {
          dispatch(setCodeMapMode(null));
      }
  }, [isCodeMapTabOpen, codeMapMode, dispatch]);

  useEffect(() => {
      if (id) { dispatch(setWorkspaceId(id)); loadWorkspaceData(id); }
  }, [id, dispatch]);

  const loadWorkspaceData = async (workspaceId) => {
      try {
          const projectsRoot = await fetchWorkspaceProjectsApi(workspaceId);
          dispatch(setProjectList(projectsRoot.children || []));
          dispatch(setWorkspaceTree(projectsRoot));
      } catch (e) { console.error("Failed to load workspace data:", e); }
  };

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
                    {isSidebarVisible && (
                        <div className="w-64 shrink-0 border-r border-gray-200 bg-[#f8f9fa]">
                            <Sidebar />
                        </div>
                    )}
                    
                    <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                        <FileTabs />
                        
                        <div className="flex-1 relative min-h-0 flex"> 
                            {/* 💡 virtual:codemap ID를 기준으로 조건부 렌더링 */}
                            {activeFileId !== 'virtual:codemap' ? (
                                <div className="w-full h-full relative">
                                    {activeFileId ? <CodeEditor /> : <div className="flex-1 flex items-center justify-center text-gray-400">파일을 선택해주세요.</div>}
                                </div>
                            ) : (
                                codeMapMode === 'split' ? (
                                    <>
                                        <div className="w-1/2 h-full border-r border-gray-300 relative">
                                            <CodeEditor />
                                        </div>
                                        <div className="w-1/2 h-full bg-[#fdfdfd] relative">
                                            <CodeMap />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full relative">
                                        <CodeMap />
                                    </div>
                                )
                            )}
                        </div>

                        {isTerminalVisible && (
                            <div className="h-[250px] shrink-0 border-t border-gray-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-10">
                                <BottomPanel />
                            </div>
                        )}
                    </div>

                    {isDebugMode ? (
                        <div className="w-[300px] shrink-0 border-l border-gray-200 z-20 bg-[#252526]">
                            <DebugPanel />
                        </div>
                    ) : (
                        isAgentVisible && (
                            <div className="w-[300px] shrink-0 border-l border-gray-200 bg-[#fbfbfc] shadow-[-1px_0_3px_rgba(0,0,0,0.02)] z-20">
                                <AgentPanel />
                            </div>
                        )
                    )}
                </div>
              );
      }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-[#333] overflow-hidden font-sans">
      <CommandPalette />
      <CreateProjectModal /> 
      <MenuBar />
      <div className="flex-1 flex overflow-hidden">
         <ActivityBar />
         {renderMainContent()}
      </div>
    </div>
  );
}