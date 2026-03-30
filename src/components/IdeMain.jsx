// 경로: src/pages/IdeMain.jsx
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

// 💡 [수정됨] closeAllFiles 액션을 불러옵니다!
import { fetchWorkspaceProjectsApi, fetchVirtualViewsApi } from '../utils/api'; 
import { setWorkspaceTree, setWorkspaceId, setProjectList, setVirtualTree, clearVirtualTree, setActiveProject, setActiveBranch, closeAllFiles } from '../store/slices/fileSystemSlice'; 

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white font-bold">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white font-bold">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white font-bold">My Page Panel</div>;

export default function IdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { activeActivity, isTerminalVisible, isSidebarVisible, isAgentVisible, isDebugMode, codeMapMode } = useSelector(state => state.ui);
  const { workspaceId, activeProject, activeBranch } = useSelector(state => state.fileSystem);

  // =========================================================================
  // 💡 [완벽 해결] 접속 시 무조건 "첫 번째 프로젝트" 또는 "기존 프로젝트" 강제 선택!
  // =========================================================================
  useEffect(() => {
    if (id) {
      // 💡 [핵심 추가] 워크스페이스 ID가 새로 들어오면(바뀌면) 무조건 열려있는 탭을 싹 다 닫습니다!
      dispatch(closeAllFiles());
      
      dispatch(setWorkspaceId(id));
      fetchWorkspaceProjectsApi(id).then(root => {
        dispatch(setWorkspaceTree(root));
        
        // 워크스페이스에 프로젝트가 1개라도 존재한다면?
        if (root && root.children && root.children.length > 0) {
            dispatch(setProjectList(root.children));
            
            // 1. 브라우저 저장소에서 이전에 작업하던 프로젝트 꺼내기
            const savedProject = localStorage.getItem(`lastProject_${id}`);
            const savedBranch = localStorage.getItem(`lastBranch_${id}`);
            
            // 2. 저장된 프로젝트가 진짜 있는 건지 확인 (삭제됐을 수도 있으니)
            const isValidProject = root.children.some(p => p.name === savedProject);
            
            // 3. 있으면 그걸로! 없거나 처음 왔으면 무조건 배열의 [0]번째(첫 번째) 프로젝트 강제 선택!
            const targetProject = isValidProject ? savedProject : root.children[0].name;
            const targetBranch = savedBranch ? savedBranch : 'master';

            // 4. 에러를 유발하던 가짜 코드를 지우고, Redux에만 깔끔하게 시작 프로젝트 세팅!
            dispatch(setActiveProject(targetProject));
            dispatch(setActiveBranch(targetBranch));
        }
      }).catch(console.error);
    }
    // eslint-disable-next-line
  }, [id, dispatch]); 

  // 💡 프로젝트나 브랜치가 변경될 때마다 로컬 스토리지에 최신상태 저장 (새로고침 방어)
  useEffect(() => {
      if (workspaceId && activeProject) localStorage.setItem(`lastProject_${workspaceId}`, activeProject);
      if (workspaceId && activeBranch) localStorage.setItem(`lastBranch_${workspaceId}`, activeBranch);
  }, [workspaceId, activeProject, activeBranch]);
  // =========================================================================

  useEffect(() => {
      if (workspaceId && activeBranch) {
          const syncBranchVirtualView = async () => {
              try {
                  const views = await fetchVirtualViewsApi(workspaceId, activeBranch);
                  const activeView = views.find(v => v.isActive === true || v.active === true);

                  if (activeView) {
                      let parsedData = [];
                      if (typeof activeView.treeDataJson === 'string') {
                          parsedData = JSON.parse(activeView.treeDataJson);
                      } else {
                          parsedData = activeView.treeDataJson || activeView.treeData || [];
                      }
                      
                      dispatch(setVirtualTree({
                          name: activeView.viewName || activeView.name || '가상 뷰',
                          children: parsedData,
                          branchName: activeBranch
                      }));
                  } else {
                      dispatch(clearVirtualTree());
                  }
              } catch (error) {
                  dispatch(clearVirtualTree()); 
              }
          };
          syncBranchVirtualView();
      }
  }, [workspaceId, activeBranch, dispatch]);

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
                        <div className="w-[260px] shrink-0 border-r border-gray-200 flex flex-col bg-[#f8f9fa]">
                            <Sidebar />
                        </div>
                    )}
                    
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        <FileTabs />
                        <div className="flex-1 flex relative overflow-hidden">
                            <div className="flex-1 flex flex-col min-w-0 relative">
                                <CodeEditor />
                                <CodeMap />
                            </div>
                        </div>
                        {isTerminalVisible && (
                            <div className="h-[250px] border-t border-gray-200 bg-white shrink-0 z-[600]">
                                <BottomPanel />
                            </div>
                        )}
                    </div>

                    {(isAgentVisible || isDebugMode) && (
                        <div className="w-[320px] shrink-0 border-l border-gray-200 flex flex-col bg-[#f8f9fa] z-[600]">
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