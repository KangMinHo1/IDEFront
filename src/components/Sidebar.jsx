// src/components/Sidebar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  VscFiles, VscNewFile, VscCollapseAll, VscFile, 
  VscTrash, VscEdit, VscChevronRight, VscChevronDown, VscRocket,
  VscRepo, VscFolder, VscNewFolder, VscRefresh
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava } from "react-icons/di";

import { openFile, closeFilesByPath, updateFileContent, setActiveProject, setWorkspaceTree, mergeProjectFiles } from '../store/slices/fileSystemSlice';
import { startCreation, endCreation, writeToTerminal } from '../store/slices/uiSlice';
import { createFileApi, fetchProjectFilesApi, deleteFileApi, renameFileApi, fetchFileContentApi, fetchWorkspaceProjectsApi } from '../utils/api';

const getFileIcon = (name) => {
    if (!name) return <VscFile className="text-gray-400" />;
    const ext = name.split('.').pop().toLowerCase();
    switch(ext) {
      case 'java': return <DiJava className="text-orange-500 text-lg" />;
      case 'py': return <DiPython className="text-blue-500 text-lg" />;
      case 'js': return <DiJsBadge className="text-yellow-400 text-lg" />;
      case 'jsx': return <DiReact className="text-blue-400 text-lg" />;
      default: return <VscFile className="text-gray-500 text-lg" />;
    }
};

// 💡 [수정] selectedFileProject 프롭스 추가 (하이라이트를 위해 현재 선택된 파일의 소속 프로젝트를 받음)
const FileTreeItem = ({ node, depth, projectName, selectedFileProject, onExpandProject, onFileClick, onContextMenu }) => {
    const { activeFileId, activeProject } = useSelector(state => state.fileSystem);
    
    const nodeType = String(node.type || '').toLowerCase();
    const isProject = nodeType === 'project';
    const isFolder = nodeType === 'folder' || nodeType === 'directory' || (node.children && Array.isArray(node.children));

    const currentProjectName = isProject ? node.name : projectName;
    const isStartupProject = isProject && activeProject === node.name;

    const [isExpanded, setIsExpanded] = useState(isStartupProject);

    useEffect(() => {
        if (isStartupProject) {
            setIsExpanded(true);
        }
    }, [isStartupProject]);

    const getIcon = () => {
        if (isProject) return <VscRepo className="text-blue-600" />;
        if (isFolder) return <VscFolder className="text-yellow-500" />;
        return getFileIcon(node.name);
    };

    const handleClick = async (e) => {
        e.stopPropagation();

        if (isProject) {
            if (!isExpanded && (!node.children || node.children.length === 0)) {
                await onExpandProject(node.name);
            }
            setIsExpanded(!isExpanded);
        } else if (isFolder) {
            setIsExpanded(!isExpanded); 
        } else {
            onFileClick(node, currentProjectName);
        }
    };

    // 💡 [핵심 수정] 파일 이름이 같더라도, 클릭했던 프로젝트와 현재 렌더링 중인 프로젝트가 일치할 때만 파란색 칠하기!
    const isSelected = activeFileId === node.id && selectedFileProject === currentProjectName;

    return (
        <div className="select-none font-sans">
            <div 
                className={`flex items-center justify-between py-[4px] px-3 cursor-pointer text-[13px] border-l-2 transition-colors
                    ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-500 font-medium' : 'border-transparent text-gray-700 hover:bg-gray-200'}
                    ${isStartupProject ? 'bg-blue-50/50' : ''}
                `}
                style={{ paddingLeft: `${depth * 12 + 10}px` }}
                onClick={handleClick}
                onContextMenu={(e) => onContextMenu(e, node)}
            >
                <div className="flex items-center overflow-hidden">
                    <span className="mr-1.5 opacity-60 text-gray-500 shrink-0">
                        {isFolder ? (
                            isExpanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />
                        ) : (
                            <span className="w-[14px] inline-block"/>
                        )}
                    </span>
                    <span className="mr-1.5 shrink-0">{getIcon()}</span>
                    <span className={`truncate ${node.name.startsWith('.') ? 'opacity-50' : ''} ${isStartupProject ? 'font-bold text-blue-700' : ''}`}>
                        {node.name}
                    </span>
                </div>
                
                {isStartupProject && (
                    <span className="shrink-0 ml-2 text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                        시작 프로젝트
                    </span>
                )}
            </div>

            {isExpanded && Array.isArray(node.children) && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem 
                            key={child.id || child.name} 
                            node={child} 
                            depth={depth + 1} 
                            projectName={currentProjectName}
                            selectedFileProject={selectedFileProject} // 💡 자식에게도 전달
                            onExpandProject={onExpandProject}
                            onFileClick={onFileClick}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar() {
  const dispatch = useDispatch();
  
  const { tree, activeFileId, workspaceId, activeProject, activeBranch } = useSelector(state => state.fileSystem);
  const { isSidebarVisible, pendingCreation } = useSelector(state => state.ui);

  const inputRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); 
  
  // 💡 [핵심 추가] 시작 프로젝트(activeProject)와 별개로, '현재 하이라이트 될 파일의 소속 프로젝트'를 따로 기억합니다.
  const [selectedFileProject, setSelectedFileProject] = useState(activeProject);

  const handleExpandProject = async (projectName) => {
      try {
          const branchToFetch = (projectName === activeProject && activeBranch) ? activeBranch : "master";
          const response = await fetchProjectFilesApi(workspaceId, projectName, branchToFetch);

          let files = [];
          if (Array.isArray(response)) {
              files = response;
          } else if (response && Array.isArray(response.children)) {
              files = response.children;
          }

          dispatch(mergeProjectFiles({ projectName, files }));
      } catch (e) {
          console.error("파일 로드 실패:", e);
      }
  };

  useEffect(() => {
      if (workspaceId && activeProject) {
          handleExpandProject(activeProject);
          setSelectedFileProject(activeProject); // 프로젝트가 바뀌면 초기화
      }
  }, [activeBranch, workspaceId, activeProject]);

  const handleFileClick = async (node, realProjectName) => {
      const targetProject = realProjectName || activeProject; 
      
      // 💡 [수정] 시작 프로젝트(activeProject)는 냅두고, 하이라이트용 상태만 바꿉니다! (자동 전환 기능 제거)
      setSelectedFileProject(targetProject);
      dispatch(openFile(node));
      
      try {
          const branchToFetch = (targetProject === activeProject && activeBranch) ? activeBranch : "master";
          const content = await fetchFileContentApi(workspaceId, targetProject, branchToFetch, node.id);
          dispatch(updateFileContent({ filePath: node.id, content: content }));
      } catch (e) {
          console.error("파일 내용 로드 실패:", e);
      }
  };

  const refreshWorkspace = async () => {
      if(!workspaceId) return;
      try {
          const rootNode = await fetchWorkspaceProjectsApi(workspaceId);
          dispatch(setWorkspaceTree(rootNode));
          if(activeProject) handleExpandProject(activeProject);
      } catch(e) {
          console.error("워크스페이스 새로고침 실패:", e);
      }
  };

  useEffect(() => {
    if (pendingCreation && inputRef.current) inputRef.current.focus();
  }, [pendingCreation]);

  const confirmInput = async (name, parentId) => {
    if (!name) { dispatch(endCreation()); return; }
    try {
        let path = name; 
        if(parentId !== 'root-folder') path = parentId + "/" + name; 
        
        await createFileApi(workspaceId, activeProject, activeBranch, path, pendingCreation.type);
        
        if (parentId === 'root-folder' && pendingCreation.type === 'folder') {
             dispatch(setActiveProject(name));
             dispatch(writeToTerminal(`[System] 새 프로젝트 '${name}' 이(가) 시작 프로젝트로 자동 지정되었습니다.\n`));
             handleExpandProject(name);
        } else {
             handleExpandProject(activeProject);
        }

        if (pendingCreation.type === 'file') {
            dispatch(openFile({ id: path, name: name, type: 'file' }));
        }
    } catch (e) { alert(e.message); }
    dispatch(endCreation());
  };

  const handleInputKeyDown = (e, parentId) => {
    if (e.key === 'Enter') confirmInput(e.target.value.trim(), parentId);
    if (e.key === 'Escape') dispatch(endCreation());
  };

  const handleContextMenu = (e, node) => {
      e.preventDefault();
      e.stopPropagation();
      
      const nodeType = String(node.type || '').toLowerCase();
      
      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          fileId: node.id,
          path: node.id, 
          type: nodeType,
          isRoot: nodeType === 'project'
      });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleDelete = async () => {
      if (!contextMenu) return;
      if (!window.confirm(`정말 '${contextMenu.path}'을(를) 삭제하시겠습니까?`)) return;

      try {
          await deleteFileApi(workspaceId, activeProject, activeBranch, contextMenu.path);
          dispatch(closeFilesByPath(contextMenu.path));
          handleExpandProject(activeProject); 
      } catch (e) { alert("삭제 실패: " + e.message); }
  };

  const startRename = () => alert("이름 변경은 아직 지원하지 않습니다.");

  const handleSetStartup = () => {
      if(!contextMenu) return;
      const targetProject = contextMenu.fileId; 
      dispatch(setActiveProject(targetProject)); 
      dispatch(writeToTerminal(`[System] 시작 프로젝트가 변경되었습니다: ${targetProject}\n`));
      setContextMenu(null);
  };

  if (!isSidebarVisible) return null;

  return (
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col font-sans">
       <div className="flex items-center justify-between px-4 h-9 border-b border-gray-200 shrink-0">
           <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">워크스페이스 탐색기</span>
           <div className="flex gap-2 text-gray-500">
               <VscRefresh className="cursor-pointer hover:text-black transition-colors" onClick={refreshWorkspace} title="새로고침"/>
               <VscNewFile className="cursor-pointer hover:text-black transition-colors" onClick={(e)=>{ e.stopPropagation(); dispatch(startCreation({type:'file', parentId: activeProject || 'root-folder' })); }} title="새 파일" />
               <VscNewFolder className="cursor-pointer hover:text-black transition-colors" onClick={(e)=>{ e.stopPropagation(); dispatch(startCreation({type:'folder', parentId: activeProject || 'root-folder' })); }} title="새 폴더" />
               <VscCollapseAll className="cursor-pointer hover:text-black transition-colors" title="모두 접기" />
           </div>
       </div>
       
       <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 py-1 mb-2">
                <span className="text-[11px] font-bold text-gray-500">워크스페이스 탐색</span> 
          </div>

          {tree && Array.isArray(tree.children) && tree.children.length > 0 ? (
              tree.children.map(projectNode => (
                  <FileTreeItem 
                      key={projectNode.id || projectNode.name} 
                      node={projectNode} 
                      depth={0} 
                      projectName={projectNode.name} 
                      selectedFileProject={selectedFileProject} // 💡 추가됨
                      onExpandProject={handleExpandProject} 
                      onFileClick={handleFileClick}
                      onContextMenu={handleContextMenu}
                  />
              ))
          ) : (
              <div className="p-4 text-xs text-gray-400 text-center mt-4">
                  프로젝트가 없습니다.<br/>상단 메뉴에서 새 프로젝트를 생성해주세요.
              </div>
          )}
          
          {pendingCreation && (
              <div className="pl-6 pr-4 py-1.5 mt-1">
                  <input 
                      ref={inputRef} autoFocus
                      className="bg-white text-gray-800 border border-blue-400 focus:border-blue-600 outline-none w-full h-7 px-2 text-xs rounded shadow-sm transition-colors" 
                      onKeyDown={(e)=>handleInputKeyDown(e, pendingCreation.parentId)} 
                      onBlur={(e)=>confirmInput(e.target.value.trim(), pendingCreation.parentId)} 
                      placeholder="이름을 입력하세요..."
                  />
              </div>
          )}
       </div>

       {contextMenu && (
           <div 
             className="fixed bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-md py-1.5 w-48 z-[9999]"
             style={{ top: contextMenu.y, left: contextMenu.x }}
           >
               {contextMenu.isRoot && (
                   <>
                       <div 
                         className="px-4 py-1.5 hover:bg-blue-50 cursor-pointer text-[13px] flex items-center gap-2 text-gray-700 font-bold transition-colors"
                         onClick={handleSetStartup}
                       >
                           <VscRocket size={14} className="text-blue-600" /> 시작 프로젝트로 설정
                       </div>
                       <div className="h-[1px] bg-gray-100 my-1 mx-2"/>
                   </>
               )}
               
               <div className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-[13px] flex items-center gap-2 text-gray-700 transition-colors" onClick={startRename}>
                   <VscEdit size={14} className="text-gray-500" /> Rename
               </div>
               <div className="px-4 py-1.5 hover:bg-red-50 cursor-pointer text-[13px] flex items-center gap-2 text-red-600 transition-colors" onClick={handleDelete}>
                   <VscTrash size={14} /> Delete
               </div>
           </div>
       )}
    </div>
  );
}