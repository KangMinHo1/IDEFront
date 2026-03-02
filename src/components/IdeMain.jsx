// src/components/IdeMain.jsx
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

// 💡 기존 API / 소켓 임포트 그대로 유지!
import { fetchWorkspaceProjectsApi } from '../utils/api'; 
import { setWorkspaceTree, setWorkspaceId, setProjectList } from '../store/slices/fileSystemSlice'; 
import { setDebugMode, setCurrentDebugLine, updateDebugVariables, writeToTerminal } from '../store/slices/uiSlice'; 
import { DebugSocket } from '../utils/debugSocket'; 

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">My Page Panel</div>;

export default function IdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { 
    isSidebarVisible, isTerminalVisible, isAgentVisible, 
    activeActivity, isDebugMode, isCodeMapVisible, codeMapMode 
  } = useSelector(state => state.ui);

  const loadWorkspaceData = async (workspaceId) => {
      try {
          const projectsRoot = await fetchWorkspaceProjectsApi(workspaceId);
          dispatch(setProjectList(projectsRoot.children || []));
          dispatch(setWorkspaceTree(projectsRoot));
      } catch (e) {
          console.error("Failed to load workspace data:", e);
      }
  };

  useEffect(() => {
      if (id) {
          dispatch(setWorkspaceId(id));
          loadWorkspaceData(id);
      }
  }, [id, dispatch]);

  useEffect(() => {
      let isComponentMounted = true; 
      let reconnectTimeoutId = null;

      const connectDebugSocket = () => {
          DebugSocket.connect(
              'ws://localhost:8080/ws/debug',
              () => console.log("Debug Socket Connected!"),
              (msg) => {
                  try {
                      const data = JSON.parse(msg);
                      if (data.type === 'SUSPENDED') {
                          dispatch(setCurrentDebugLine({ line: data.line, path: data.path }));
                          dispatch(updateDebugVariables(data.variables || {}));
                      } 
                      else if (data.type === 'OUTPUT' || data.type === 'ERROR') {
                          dispatch(writeToTerminal((data.data || '') + '\n'));
                          if (data.data && data.data.includes('Debugging Finished')) {
                              dispatch(setDebugMode(false));
                              dispatch(setCurrentDebugLine(null));
                              dispatch(updateDebugVariables({}));
                          }
                      }
                  } catch (e) {
                      dispatch(writeToTerminal(msg + '\n'));
                  }
              },
              () => {
                  console.log("Debug Socket Closed.");
                  if (!isComponentMounted) return; 
                  dispatch(setDebugMode(false));
                  dispatch(setCurrentDebugLine(null));
                  dispatch(updateDebugVariables({}));
                  reconnectTimeoutId = setTimeout(connectDebugSocket, 1000);
              }
          );
      };

      connectDebugSocket();

      return () => {
          isComponentMounted = false;
          if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
          DebugSocket.disconnect();
      };
  }, [dispatch]); 

  const renderMainContent = () => {
      switch (activeActivity) {
          case 'docs': return <DocsPanel />;
          case 'api-test': return <ApiTestPanel />;
          case 'mypage': return <MyPagePanel />;
          case 'git': return <div className="flex-1 flex min-w-0 bg-white"><GitDashboard /></div>;
              
          case 'editor':
          default:
              return (
                <div className="flex-1 flex min-w-0">
                    {/* 1. 좌측 사이드바 */}
                    {isSidebarVisible && (
                        <div className="w-64 shrink-0 border-r border-gray-200 bg-[#f8f9fa]">
                            <Sidebar />
                        </div>
                    )}
                    
                    {/* 2. 메인 에디터 영역 (분할 화면 시 flex-1로 절반 크기) */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                        <FileTabs />
                        <div className="flex-1 relative min-h-0"> 
                            <CodeEditor /> 
                        </div>
                        {isTerminalVisible && (
                            <div className="h-[250px] shrink-0 border-t border-gray-200 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-10">
                                <BottomPanel />
                            </div>
                        )}
                    </div>

                    {/* 💡 [핵심] 3. 분할 화면 모드일 때 우측에 렌더링 (flex-1 속성으로 에디터와 5:5 비율을 맞춤) */}
                    {isCodeMapVisible && codeMapMode === 'split' && (
                        <div className="flex-1 min-w-[300px] border-l border-gray-200 z-10 bg-white relative">
                            <CodeMap />
                        </div>
                    )}

                    {/* 4. 디버그 및 AI 패널 */}
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
    <div className="h-screen w-screen flex flex-col bg-white text-[#333] overflow-hidden font-sans relative">
      <CommandPalette />
      <CreateProjectModal /> 
      <MenuBar />
      
      <div className="flex-1 flex overflow-hidden relative">
         <ActivityBar />
         
         {renderMainContent()}
         
         {/* 💡 [핵심] 전체 화면 모드일 때만 ActivityBar 우측의 모든 영역을 덮도록 absolute 사용 */}
         {isCodeMapVisible && codeMapMode === 'full' && (
            <div className="absolute inset-0 left-12 z-[100] bg-white">
                <CodeMap />
            </div>
         )}
      </div>
    </div>
  );
}