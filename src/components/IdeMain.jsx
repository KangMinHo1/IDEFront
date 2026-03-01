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

import { fetchWorkspaceProjectsApi } from '../utils/api'; 
import { setWorkspaceTree, setWorkspaceId, setProjectList } from '../store/slices/fileSystemSlice'; 

// 💡 Redux 액션 임포트 (setDebugMode 추가됨)
import { setDebugMode, setCurrentDebugLine, updateDebugVariables, writeToTerminal } from '../store/slices/uiSlice'; 

// 💡 DebugSocket 임포트
import { DebugSocket } from '../utils/debugSocket'; 

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500">My Page Panel</div>;

export default function IdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { 
    isSidebarVisible, isTerminalVisible, isAgentVisible, 
    activeActivity, isDebugMode 
  } = useSelector(state => state.ui);

  // 기존 워크스페이스 로드 로직
  useEffect(() => {
      if (id) {
          dispatch(setWorkspaceId(id));
          loadWorkspaceData(id);
      }
  }, [id, dispatch]);

  // 💡 [핵심 수정] 서버에서 오는 디버그 메시지 처리 및 종료/재연결 로직
  useEffect(() => {
      let isComponentMounted = true; // 컴포넌트가 언마운트되었을 때 재연결을 막기 위한 플래그
      let reconnectTimeoutId = null;

      const connectDebugSocket = () => {
          DebugSocket.connect(
              'ws://localhost:8080/ws/debug',
              () => console.log("Debug Socket Connected!"),
              (msg) => {
                  try {
                      const data = JSON.parse(msg);
                      
                      // 1. 디버거가 특정 줄에 멈췄을 때 (노란 줄 & 변수 표시)
                      if (data.type === 'SUSPENDED') {
                          dispatch(setCurrentDebugLine({ line: data.line, path: data.path }));
                          dispatch(updateDebugVariables(data.variables || {}));
                      } 
                      // 2. 일반 출력 및 디버깅 종료 메시지 처리
                      else if (data.type === 'OUTPUT' || data.type === 'ERROR') {
                          dispatch(writeToTerminal((data.data || '') + '\n'));
                          
                          // 💡 디버깅이 끝났다는 메시지를 받으면 즉시 화면(노란 줄, 변수 창) 초기화!
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
                  if (!isComponentMounted) return; // 페이지를 이동했으면 무시

                  // 💡 서버가 강제로 소켓을 끊었을 때도 안전하게 화면을 원래대로 돌려놓음
                  dispatch(setDebugMode(false));
                  dispatch(setCurrentDebugLine(null));
                  dispatch(updateDebugVariables({}));
                  
                  // 💡 다음 디버깅을 위해 1초 뒤에 백그라운드에서 다시 소켓 연결 시도!
                  reconnectTimeoutId = setTimeout(connectDebugSocket, 1000);
              }
          );
      };

      // 처음 컴포넌트가 마운트될 때 웹소켓 연결 시작
      connectDebugSocket();

      // 클린업 함수: 컴포넌트가 사라질 때 모든 연결을 해제
      return () => {
          isComponentMounted = false;
          if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
          DebugSocket.disconnect();
      };
  }, [dispatch]); 

  const loadWorkspaceData = async (workspaceId) => {
      try {
          const projectsRoot = await fetchWorkspaceProjectsApi(workspaceId);
          dispatch(setProjectList(projectsRoot.children || []));
          dispatch(setWorkspaceTree(projectsRoot));
      } catch (e) {
          console.error("Failed to load workspace data:", e);
      }
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
                    {/* 탐색기 사이드바 */}
                    {isSidebarVisible && (
                        <div className="w-64 shrink-0 border-r border-gray-200 bg-[#f8f9fa]">
                            <Sidebar />
                        </div>
                    )}
                    
                    {/* 코드 에디터 메인 영역 */}
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

                    {/* 디버그/AI 우측 패널 */}
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