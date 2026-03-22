// src/components/Sidebar.jsx

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  VscFiles, VscNewFile, VscCollapseAll, VscFile, 
  VscTrash, VscEdit, VscChevronRight, VscChevronDown, VscRocket,
  VscRepo, VscFolder, VscNewFolder, VscRefresh, VscSparkle
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava, DiMarkdown } from "react-icons/di";

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
      case 'jsx': case 'tsx': return <DiReact className="text-blue-400 text-lg" />;
      case 'md': return <DiMarkdown className="text-gray-500 text-lg" />;
      default: return <VscFile className="text-gray-500 text-lg" />;
    }
};

const FileTreeItem = ({ node, depth, projectName, onExpandProject, onFileClick, onContextMenu }) => {
    const { activeFileId, activeProject } = useSelector(state => state.fileSystem);
    const [isExpanded, setIsExpanded] = useState(false);

    const currentProjectName = node.type === 'project' ? node.name : projectName;

    // 💡 [수정됨] AI가 응답한 VIRTUAL_FOLDER와 FILE 타입도 정상적으로 인식하도록 처리
    const nodeType = (node.type || 'file').toLowerCase();
    const isProject = nodeType === 'project';
    const isFolder = nodeType === 'folder' || nodeType === 'virtual_folder';
    const isFile = nodeType === 'file' || (!isProject && !isFolder && !node.children);

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

    // 가상 뷰 상태에서는 node.id가 없을 수 있으므로 realPath를 대체 키로 사용
    const isSelected = activeFileId === (node.realPath || node.id);
    const isStartupProject = isProject && activeProject === node.name;

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
                <div className="flex items-center overflow-hidden group">
                    <span className="mr-1.5 opacity-60 text-gray-500 shrink-0">
                        {(isFolder || isProject) && (
                            isExpanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />
                        )}
                        {isFile && <span className="w-[14px] inline-block"/>}
                    </span>
                    <span className="mr-1.5 shrink-0">{getIcon()}</span>
                    <span className={`truncate ${node.name.startsWith('.') ? 'opacity-50' : ''} ${isStartupProject ? 'font-bold text-blue-700' : ''}`}>
                        {node.name}
                    </span>
                    {/* 💡 마우스 호버 시 가상 뷰의 원래 경로(realPath) 표시 */}
                    {node.realPath && (
                        <span className="ml-2 text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 truncate max-w-[120px]">
                            {node.realPath}
                        </span>
                    )}
                </div>
                
                {isStartupProject && (
                    <span className="shrink-0 ml-2 text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                        시작 프로젝트
                    </span>
                )}
            </div>

            {isExpanded && Array.isArray(node.children) && (
                <div>
                    {node.children
                        .filter(child => child.name !== '$$codemap$$' && !child.name.includes('$$codemap$$')) 
                        .map((child, idx) => (
                        <FileTreeItem 
                            key={child.id || child.realPath || idx} 
                            node={child} 
                            depth={depth + 1} 
                            projectName={currentProjectName}
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
  
  // 💡 [추가] Redux에서 virtualTree 상태도 가져옵니다.
  const { tree, virtualTree, activeFileId, workspaceId, activeProject, activeBranch } = useSelector(state => state.fileSystem);
  const { isSidebarVisible, pendingCreation } = useSelector(state => state.ui);

  // 💡 가상 뷰가 적용 중인지 판단하는 변수
  const isVirtualMode = virtualTree !== null && virtualTree !== undefined;

  const inputRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); 
  
  const handleExpandProject = async (projectName) => {
      if (isVirtualMode) return; // 가상 뷰 모드에서는 프로젝트 확장을 막음
      try {
          const branchToFetch = (projectName === activeProject && activeBranch) ? activeBranch : "master";
          const files = await fetchProjectFilesApi(workspaceId, projectName, branchToFetch);
          dispatch(mergeProjectFiles({ projectName, files }));
      } catch (e) {
          console.error("파일 로드 실패:", e);
      }
  };

  useEffect(() => {
      if (workspaceId && activeProject && !isVirtualMode) {
          handleExpandProject(activeProject);
      }
  }, [activeBranch, workspaceId, activeProject, isVirtualMode]);

  const handleFileClick = async (node, realProjectName) => {
      let targetProject = realProjectName || activeProject; 
      let targetFilePath = node.id || node.name;

      // 💡 [핵심 로직] AI 가상 뷰의 파일인 경우, realPath를 쪼개서 진짜 프로젝트명과 파일 경로를 찾습니다!
      if (isVirtualMode && node.realPath) {
          const pathParts = node.realPath.split('/');
          targetProject = pathParts[0]; // 맨 앞이 실제 프로젝트 폴더명 (예: "자바1")
          targetFilePath = pathParts.slice(1).join('/'); // 나머지가 내부 경로 (예: "Main.java")
      }

      // 에디터에 열기 위해 노드 정보 세팅
      const fileToOpen = { ...node, id: isVirtualMode ? node.realPath : node.id, type: 'file' };
      dispatch(openFile(fileToOpen));
      
      try {
          const branchToFetch = (targetProject === activeProject && activeBranch) ? activeBranch : "master";
          const content = await fetchFileContentApi(workspaceId, targetProject, branchToFetch, targetFilePath);
          dispatch(updateFileContent({ filePath: fileToOpen.id, content: content }));
      } catch (e) {
          console.error("파일 내용 로드 실패:", e);
      }
  };

  const refreshWorkspace = async () => {
      if(!workspaceId || isVirtualMode) return;
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
        
        if(parentId !== 'root-folder' && parentId !== '') {
            path = parentId + "/" + name; 
        }
        
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
      // 💡 가상 뷰 상태에서는 우클릭(생성/삭제 등)을 임시로 막습니다.
      if (isVirtualMode) return; 

      setContextMenu({
          x: e.clientX,
          y: e.clientY,
          fileId: node.id,
          path: node.id, 
          type: node.type,
          isRoot: node.type === 'project'
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

  const handleContextMenuNew = (creationType) => {
      if (!contextMenu) return;

      let parentId = contextMenu.path;
      
      if (contextMenu.type === 'project') {
          parentId = '';
      } else if (contextMenu.type === 'file') {
          const pathParts = parentId.split('/');
          pathParts.pop(); 
          parentId = pathParts.join('/'); 
      }

      dispatch(startCreation({ type: creationType, parentId: parentId }));
      setContextMenu(null); 
  };

  if (!isSidebarVisible) return null;

  // 💡 [핵심] 가상 뷰(virtualTree)가 켜져 있으면 그걸 먼저 보여주고, 아니면 원본 트리(tree)를 보여줍니다!
  const displayTreeChildren = isVirtualMode ? virtualTree.children : (tree?.children || []);

  return (
    <div className="h-full w-full bg-[#f8f9fa] flex flex-col font-sans shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)]">
       {/* 상단 툴바 */}
       <div className="flex items-center justify-between px-4 h-9 border-b border-gray-200 shrink-0 bg-white">
           <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">탐색기</span>
           <div className="flex gap-2 text-gray-500">
               {!isVirtualMode && (
                   <>
                       <VscRefresh className="cursor-pointer hover:text-black transition-colors" onClick={refreshWorkspace} title="새로고침"/>
                       <VscNewFile className="cursor-pointer hover:text-black transition-colors" onClick={(e)=>{ e.stopPropagation(); dispatch(startCreation({type:'file', parentId: activeProject ? '' : 'root-folder' })); }} title="새 파일" />
                       <VscNewFolder className="cursor-pointer hover:text-black transition-colors" onClick={(e)=>{ e.stopPropagation(); dispatch(startCreation({type:'folder', parentId: activeProject ? '' : 'root-folder' })); }} title="새 폴더" />
                   </>
               )}
               <VscCollapseAll className="cursor-pointer hover:text-black transition-colors" title="모두 접기" />
           </div>
       </div>

       {/* 💡 가상 뷰 적용 시 나타나는 눈에 띄는 배지 영역 */}
       {isVirtualMode && (
           <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 border-b border-indigo-100 shrink-0">
               <span className="text-[12px] font-extrabold text-indigo-700 flex items-center gap-1.5">
                   <VscSparkle size={14} className="animate-pulse"/> AI 뷰 적용 중
               </span>
               <span className="text-[10px] text-indigo-400 font-bold max-w-[80px] truncate" title={virtualTree.name}>{virtualTree.name}</span>
           </div>
       )}
       
       <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {displayTreeChildren.length > 0 ? (
              displayTreeChildren.map((node, idx) => (
                  <FileTreeItem 
                      key={node.id || node.realPath || node.name || idx} 
                      node={node} 
                      depth={0} 
                      projectName={isVirtualMode ? '' : node.name} 
                      onExpandProject={handleExpandProject} 
                      onFileClick={handleFileClick}
                      onContextMenu={handleContextMenu}
                  />
              ))
          ) : (
              <div className="p-4 text-xs text-gray-400 text-center mt-4 border border-dashed border-gray-300 mx-4 rounded-xl">
                  {isVirtualMode ? "가상 뷰에 파일이 없습니다." : "프로젝트가 없습니다. 상단에서 생성해주세요."}
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

       {/* 우클릭 컨텍스트 메뉴 (가상 뷰에서는 안 뜸) */}
       {contextMenu && !isVirtualMode && (
           <div 
             className="fixed bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-md py-1.5 w-48 z-[9999]"
             style={{ top: contextMenu.y, left: contextMenu.x }}
           >
               <div 
                   className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-[13px] flex items-center gap-2 text-gray-700 transition-colors" 
                   onClick={() => handleContextMenuNew('file')}
               >
                   <VscNewFile size={14} className="text-gray-500" /> 새 파일 (New File)
               </div>
               <div 
                   className="px-4 py-1.5 hover:bg-gray-100 cursor-pointer text-[13px] flex items-center gap-2 text-gray-700 transition-colors" 
                   onClick={() => handleContextMenuNew('folder')}
               >
                   <VscNewFolder size={14} className="text-gray-500" /> 새 폴더 (New Folder)
               </div>

               <div className="h-[1px] bg-gray-100 my-1 mx-2"/>

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