// src/components/MenuBar.jsx
<<<<<<< HEAD
=======

>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveBranch, closeAllFiles, closeFile } from '../store/slices/fileSystemSlice';
<<<<<<< HEAD
// 💡 openCodeMap 임포트 추가
import { openProjectModal, setDebugMode, writeToTerminal, setActiveBottomTab, setCurrentDebugLine, updateDebugVariables, toggleSidebar, triggerEditorCmd, toggleTerminal, openCodeMap } from '../store/slices/uiSlice';
import { DebugSocket } from '../utils/debugSocket'; 
import { RunSocket } from '../utils/runSocket'; 
import { VscBell, VscSourceControl, VscChevronDown, VscAdd, VscRefresh } from "react-icons/vsc";
=======
import { openProjectModal, setDebugMode, writeToTerminal, setActiveBottomTab, setCurrentDebugLine, updateDebugVariables, toggleSidebar, triggerEditorCmd, toggleTerminal } from '../store/slices/uiSlice';
import { DebugSocket } from '../utils/debugSocket'; 
import { RunSocket } from '../utils/runSocket'; 
import { VscBell, VscSourceControl, VscChevronDown, VscAdd, VscRefresh } from "react-icons/vsc";
// 💡 updateGitUrlApi는 더 이상 여기서 안 쓰므로 뺐습니다.
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
import { fetchBranchListApi, createBranchApi, saveFileApi } from '../utils/api'; 

const getLanguageFromPath = (path) => {
    if (!path) return 'UNKNOWN';
    const ext = path.split('.').pop().toLowerCase();
    switch (ext) {
        case 'java': return 'JAVA';
        case 'py': return 'PYTHON';
        case 'cpp': case 'cc': case 'cxx': return 'CPP';
        case 'c': return 'C';
        case 'cs': return 'CSHARP';
        case 'js': return 'JAVASCRIPT';
        case 'ts': return 'TYPESCRIPT';
        default: return 'UNKNOWN';
    }
};

export default function MenuBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { workspaceId, activeProject, activeBranch, fileContents, activeFileId } = useSelector(state => state.fileSystem);
  const { isTerminalVisible, breakpoints } = useSelector(state => state.ui);

  const [activeMenu, setActiveMenu] = useState(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  
  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const branchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setActiveMenu(null);
      if (notiRef.current && !notiRef.current.contains(event.target)) setIsNotiOpen(false);
      if (branchRef.current && !branchRef.current.contains(event.target)) setIsBranchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (workspaceId && activeProject) {
          fetchBranchListApi(workspaceId, activeProject)
              .then(list => setBranches(list))
              .catch(err => console.error("브랜치 목록 로드 실패:", err));
      } else {
          setBranches([]);
      }
  }, [workspaceId, activeProject, isBranchOpen]);

  const handleSelectBranch = (branchName) => {
      if (branchName === activeBranch) return; 
      dispatch(closeAllFiles());
      dispatch(setActiveBranch(branchName)); 
      setIsBranchOpen(false);
  };

  const handleCreateBranch = async () => {
      if (!newBranchName.trim()) return;
      try {
          setIsCreatingBranch(true);
          await createBranchApi(workspaceId, activeProject, newBranchName);
          dispatch(closeAllFiles());
          dispatch(setActiveBranch(newBranchName));
          setNewBranchName("");
          setIsBranchOpen(false);
      } catch (error) {
          alert(error.message);
      } finally {
          setIsCreatingBranch(false);
      }
  };

  const handleMenuItemClick = async (menuName, itemName) => {
      setActiveMenu(null); 
      
      switch (itemName) {
          case '새 파일':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 새 파일을 생성합니다.\n'));
              break;
          case '파일 열기...':
          case '폴더 열기...':
          case '탐색기':
              dispatch(toggleSidebar());
              break;
          case '저장':
              if (!activeFileId || !workspaceId || !activeProject) {
                  alert('저장할 파일이나 프로젝트가 선택되지 않았습니다.');
                  return;
              }
              try {
                  const content = fileContents[activeFileId] || '';
<<<<<<< HEAD
=======
                  // 💡 [수정] 저장할 때 기준도 master로!
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                  await saveFileApi(workspaceId, activeProject, activeBranch || 'master', activeFileId, content);
                  if (!isTerminalVisible) dispatch(toggleTerminal());
                  dispatch(writeToTerminal(`[System] Saved: ${activeFileId}\n`));
              } catch (error) {
                  if (!isTerminalVisible) dispatch(toggleTerminal());
                  dispatch(writeToTerminal(`[Error] Save failed: ${error.message}\n`));
              }
              break;
          case '다른 이름으로...':
<<<<<<< HEAD
          case '모두 저장':
          case '내보내기':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal(`[System] ${itemName} 기능 준비 중입니다.\n`));
=======
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 다른 이름으로 저장 기능 준비 중입니다.\n'));
              break;
          case '모두 저장':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 모든 변경사항을 저장합니다.\n'));
              break;
          case '내보내기':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 프로젝트 내보내기를 시작합니다.\n'));
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
              break;
          case '닫기':
              dispatch(closeFile(activeFileId));
              break;

          case '실행 취소': dispatch(triggerEditorCmd('undo')); break;
          case '다시 실행': dispatch(triggerEditorCmd('redo')); break;
          case '잘라내기': dispatch(triggerEditorCmd('cut')); break;
          case '복사': dispatch(triggerEditorCmd('copy')); break;
          case '붙여넣기': dispatch(triggerEditorCmd('paste')); break;
          case '찾기': dispatch(triggerEditorCmd('find')); break;
          case '바꾸기': dispatch(triggerEditorCmd('replace')); break;

          case '검색':
          case '소스 제어':
          case '실행 및 디버그':
          case '확장':
              dispatch(toggleSidebar());
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal(`[System] ${itemName} 패널을 엽니다.\n`));
              break;
          case '출력': 
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(setActiveBottomTab('output')); 
              break;
          case '디버그 콘솔': 
          case '터미널':
          case '새 터미널': 
          case '터미널 분할':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(setActiveBottomTab('terminal')); 
              dispatch(writeToTerminal(`[System] ${itemName} 세션을 엽니다.\n$ `));
              break;
          case '확대': dispatch(triggerEditorCmd('zoom_in')); break;
          case '축소': dispatch(triggerEditorCmd('zoom_out')); break;

          case '정의로 이동': dispatch(triggerEditorCmd('go_to_definition')); break;
          case '참조로 이동': 
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 참조로 이동 기능 준비 중입니다.\n'));
              break;
          case '줄로 이동...': dispatch(triggerEditorCmd('go_to_line')); break;

          case '디버깅 시작':
              if (!activeFileId || !workspaceId || !activeProject) {
                  alert("디버깅할 파일을 에디터에 열어주세요!");
                  return;
              }

              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(setDebugMode(true));
              dispatch(setActiveBottomTab('output'));

              try {
                  const content = fileContents[activeFileId] || '';
<<<<<<< HEAD
=======
                  // 💡 [수정]
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                  await saveFileApi(workspaceId, activeProject, activeBranch || 'master', activeFileId, content);
                  dispatch(writeToTerminal(`\r\n[System] 코드를 자동 저장했습니다: ${activeFileId}\r\n`));
              } catch (error) {
                  dispatch(writeToTerminal(`\r\n[Error] 실행 전 자동 저장에 실패했습니다: ${error.message}\r\n`));
                  return; 
              }

              dispatch(writeToTerminal('[System] 백엔드 디버거와 연결을 시도합니다...\n'));
              
              if (DebugSocket) {
                  const currentFileBreakpoints = breakpoints
                      .filter(bp => bp.path === activeFileId)
                      .map(bp => ({ line: bp.line }));

                  DebugSocket.startDebug(
                      workspaceId, 
                      activeProject, 
<<<<<<< HEAD
                      activeBranch || 'master',
=======
                      activeBranch || 'master', // 💡 [수정]
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                      activeFileId, 
                      currentFileBreakpoints 
                  );
              }
              break;

          case '디버깅 없이 실행':
              if (!activeFileId || !workspaceId || !activeProject) {
                  alert("실행할 파일을 에디터에 열어주세요!");
                  return;
              }

              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(setActiveBottomTab('output'));
              
              try {
                  const content = fileContents[activeFileId] || '';
<<<<<<< HEAD
=======
                  // 💡 [수정]
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                  await saveFileApi(workspaceId, activeProject, activeBranch || 'master', activeFileId, content);
                  dispatch(writeToTerminal(`\r\n[System] 코드를 자동 저장했습니다: ${activeFileId}\r\n`));
              } catch (error) {
                  dispatch(writeToTerminal(`\r\n[Error] 실행 전 자동 저장에 실패했습니다: ${error.message}\r\n`));
                  return; 
              }

              const language = getLanguageFromPath(activeFileId);
              dispatch(writeToTerminal(`[System] ${language} 환경에서 ${activeFileId} 실행을 준비합니다...\r\n`));

              const runPayload = {
                  type: 'RUN',
                  workspaceId: workspaceId,
                  projectName: activeProject,
<<<<<<< HEAD
                  branchName: activeBranch || 'master',
=======
                  branchName: activeBranch || 'master', // 💡 [수정]
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                  filePath: activeFileId,
                  language: language
              };

              RunSocket.connectAndRun(
                  'ws://localhost:8080/ws/run',
                  runPayload,
                  (msg) => dispatch(writeToTerminal(msg)),
                  (err) => dispatch(writeToTerminal('\r\n[Error] 실행 중 웹소켓 에러가 발생했습니다.\r\n')),
                  () => dispatch(writeToTerminal('\r\n[System] 실행이 완전히 종료되었습니다.\r\n'))
              );
              break;

          case '디버깅 중지':
              dispatch(setDebugMode(false));
              if (DebugSocket && typeof DebugSocket.stopDebug === 'function') DebugSocket.stopDebug();
              if (RunSocket && typeof RunSocket.stop === 'function') RunSocket.stop(); 
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 실행/디버깅을 중지합니다.\n'));
              break;
          case '한 단계씩 코드 실행':
              if (DebugSocket && typeof DebugSocket.stepOver === 'function') DebugSocket.stepOver();
              break;
          case '프로시저 단위 실행':
              if (DebugSocket && typeof DebugSocket.stepInto === 'function') DebugSocket.stepInto();
              break;
          case '중단점 설정/해제': 
              dispatch(triggerEditorCmd('toggle_breakpoint')); 
              break;

          case '프로젝트 빌드':
          case '다시 빌드':
              if (!workspaceId || !activeProject) {
                  alert("빌드할 프로젝트를 탐색기에서 선택해주세요!");
                  return;
              }

              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(setActiveBottomTab('output')); 
              dispatch(writeToTerminal(`\r\n[System] 🔨 ${activeProject} 프로젝트 빌드를 시작합니다...\r\n`));

              fetch(`http://localhost:8080/api/workspaces/build`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      workspaceId: workspaceId,
                      projectName: activeProject,
<<<<<<< HEAD
                      branchName: activeBranch || 'master'
=======
                      branchName: activeBranch || 'master' // 💡 [수정]
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                  })
              })
              .then(async (res) => {
                  if (!res.ok) {
                      const text = await res.text();
                      throw new Error(text || "서버에서 빌드 중 에러가 발생했습니다.");
                  }
                  
                  const lang = getLanguageFromPath(activeFileId);
                  let defaultExtension = '';
                  if (lang === 'JAVA') defaultExtension = '.jar';
                  else if (lang === 'C' || lang === 'CPP') defaultExtension = '.exe'; 
                  
                  let filename = `${activeProject}_build_result${defaultExtension}`;
                  
                  const disposition = res.headers.get('Content-Disposition');
                  if (disposition && disposition.includes('filename=')) {
                      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                      if (matches != null && matches[1]) {
                          filename = matches[1].replace(/['"]/g, '');
                          try { filename = decodeURIComponent(filename); } catch(e) {}
                      }
                  }
                  
                  const blob = await res.blob();
                  return { blob, filename };
              })
              .then(({ blob, filename }) => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename; 
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  
                  dispatch(writeToTerminal(`[System] ✅ 빌드 성공! 파일(${filename})이 정상적으로 다운로드되었습니다.\r\n`));
              })
              .catch(err => {
                  dispatch(writeToTerminal(`[Error] ❌ 빌드 실패: ${err.message}\r\n`));
              });
              break;

          case '빌드 취소':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal('[System] 빌드를 취소했습니다.\n'));
              break;

<<<<<<< HEAD
          // 💡 [핵심] 맵 관련 액션 분리
          case '전체 화면':
              dispatch(openCodeMap('full'));
              break;
          case '분할 화면':
              dispatch(openCodeMap('split'));
              break;

          case '정보':
          case '문서':
          case '키보드 단축키':
=======
          case '정보':
          case '문서':
          case '키보드 단축키':
          case '전체 화면':
          case '분할 화면':
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
          case 'Commit & Merge':
          case 'Repository Settings':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal(`[System] ${itemName} 기능 준비 중입니다.\n`));
              break;
              
          default:
              console.log(`${menuName} - ${itemName} 기능이 스위치 문에 없습니다.`);
              break;
      }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleMenuItemClick(null, '저장');
      } else if (e.key === 'F5' && !e.shiftKey) {
        e.preventDefault();
        handleMenuItemClick(null, '디버깅 시작');
      } else if (e.ctrlKey && e.key === 'F5') { 
        e.preventDefault();
        handleMenuItemClick(null, '디버깅 없이 실행');
      } else if (e.shiftKey && e.key === 'F5') {
        e.preventDefault();
        handleMenuItemClick(null, '디버깅 중지');
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleMenuItemClick(null, '한 단계씩 코드 실행');
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleMenuItemClick(null, '프로시저 단위 실행');
      } else if (e.ctrlKey && e.shiftKey && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        handleMenuItemClick(null, '새 터미널');
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleMenuItemClick(null, '탐색기');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, workspaceId, activeProject, activeBranch, fileContents, isTerminalVisible]);

  const gnbMenus = ['대시보드', '일정관리', '개발일지', '마이페이지', '이용가이드'];
  
  const subMenus = [
    { name: '파일', items: [
        { label: '새 파일', shortcut: 'Ctrl+N' }, 
        { label: '파일 열기...', shortcut: 'Ctrl+O' }, 
        { label: '폴더 열기...', shortcut: 'Ctrl+Shift+O' }, 
        { label: '저장', shortcut: 'Ctrl+S' }, 
        { label: '다른 이름으로...', shortcut: 'Ctrl+Shift+S' }, 
        { label: '모두 저장', shortcut: 'Ctrl+K S' }, 
        { label: '내보내기' }, 
        { label: '닫기', shortcut: 'Ctrl+W' }
    ]},
    { name: '편집', items: [
        { label: '실행 취소', shortcut: 'Ctrl+Z' }, 
        { label: '다시 실행', shortcut: 'Ctrl+Y' }, 
        { label: '잘라내기', shortcut: 'Ctrl+X' }, 
        { label: '복사', shortcut: 'Ctrl+C' }, 
        { label: '붙여넣기', shortcut: 'Ctrl+V' }, 
        { label: '찾기', shortcut: 'Ctrl+F' }, 
        { label: '바꾸기', shortcut: 'Ctrl+H' }
    ]},
    { name: '보기', items: [
        { label: '탐색기', shortcut: 'Ctrl+Shift+E' }, 
        { label: '검색', shortcut: 'Ctrl+Shift+F' }, 
        { label: '소스 제어', shortcut: 'Ctrl+Shift+G' }, 
        { label: '실행 및 디버그', shortcut: 'Ctrl+Shift+D' }, 
        { label: '확장', shortcut: 'Ctrl+Shift+X' }, 
        { label: '출력', shortcut: 'Ctrl+Shift+U' }, 
        { label: '디버그 콘솔', shortcut: 'Ctrl+Shift+Y' }, 
        { label: '터미널', shortcut: 'Ctrl+`' }, 
        { label: '확대', shortcut: 'Ctrl+=' }, 
        { label: '축소', shortcut: 'Ctrl+-' }
    ]},
    { name: '이동', items: [
        { label: '정의로 이동', shortcut: 'F12' }, 
        { label: '참조로 이동', shortcut: 'Shift+F12' }, 
        { label: '줄로 이동...', shortcut: 'Ctrl+G' }
    ]},
    { name: '디버그', items: [
        { label: '디버깅 시작', shortcut: 'F5' }, 
        { label: '디버깅 없이 실행', shortcut: 'Ctrl+F5' }, 
        { label: '디버깅 중지', shortcut: 'Shift+F5' }, 
        { label: '중단점 설정/해제', shortcut: 'F9' }, 
        { label: '한 단계씩 코드 실행', shortcut: 'F10' }, 
        { label: '프로시저 단위 실행', shortcut: 'F11' }
    ]},
    { name: '빌드', items: [
        { label: '프로젝트 빌드', shortcut: 'Ctrl+Shift+B' }, 
        { label: '다시 빌드' }, 
        { label: '빌드 취소' }
    ]},
    { name: '터미널', items: [
        { label: '새 터미널', shortcut: 'Ctrl+Shift+`' }, 
        { label: '터미널 분할', shortcut: 'Ctrl+Shift+5' }
    ]},
    { name: '도움말', items: [
        { label: '정보' }, 
        { label: '문서' }, 
        { label: '키보드 단축키', shortcut: 'Ctrl+K Ctrl+S' }
    ]},
    { name: '코드맵', items: [
        { label: '전체 화면' }, 
        { label: '분할 화면' }
    ]},
    { name: 'Git', items: [
        { label: 'Commit & Merge' }, 
        { label: 'Repository Settings' }
    ]}
  ];

<<<<<<< HEAD
  const currentBranch = activeProject ? (activeBranch || 'master') : 'No Project';

  return (
    <div className="flex flex-col w-full border-b border-gray-200 bg-white shrink-0 z-40">
=======
  // 💡 [수정] URL 여부와 상관없이 오직 브랜치 이름만 표시!
  const currentBranch = activeProject ? (activeBranch || 'master') : 'No Project';

  return (
    <div className="flex flex-col w-full border-b border-gray-200 bg-white shrink-0">
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
      <div className="flex items-center justify-between px-6 h-12 relative">
        <div className="font-extrabold text-xl tracking-tight text-black cursor-pointer" onClick={() => navigate('/')}>VSIDE</div>
        <div className="flex items-center gap-8 text-[13px] font-medium text-gray-600">
          {gnbMenus.map(menu => (<span key={menu} className="cursor-pointer hover:text-blue-600 transition-colors">{menu}</span>))}
        </div>
        <div className="flex items-center gap-5 text-[13px] font-semibold text-gray-800">
           <div className="relative" ref={notiRef}>
              <div className={`relative cursor-pointer transition-colors p-1.5 rounded-md ${isNotiOpen ? 'bg-gray-100 text-blue-600' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'}`} onClick={() => setIsNotiOpen(!isNotiOpen)}>
                  <VscBell size={20} />
              </div>
           </div>
           <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
               <div className="w-7 h-7 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center text-xs text-blue-700 font-bold">노</div>
               <span>노민주 님</span>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 h-9 bg-[#f8f9fa] border-t border-gray-100 relative" ref={menuRef}>
        <div className="flex items-center gap-1 text-[13px] text-gray-700">
            {subMenus.map(menu => (
                <div key={menu.name} className="relative">
                    <div 
                        className={`cursor-pointer px-3 py-1 rounded transition-colors ${activeMenu === menu.name ? 'bg-gray-200 font-medium' : 'hover:bg-gray-200'}`} 
                        onClick={() => setActiveMenu(activeMenu === menu.name ? null : menu.name)}
                    >
                        {menu.name}
                    </div>
                    
                    {activeMenu === menu.name && (
                        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.1)] rounded-md py-1.5 z-[9999]">
                            {menu.items.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => handleMenuItemClick(menu.name, item.label)} 
                                    className="px-5 py-1.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer text-[13px] text-gray-700 transition-colors flex justify-between items-center"
                                >
                                    <span>{item.label}</span>
                                    {item.shortcut && <span className="text-[11px] text-gray-400">{item.shortcut}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>

        <div className="flex items-center gap-3">
            <button onClick={() => dispatch(openProjectModal())} className="flex items-center gap-1 text-[12px] font-bold bg-[#333] text-white px-2.5 py-1 rounded hover:bg-black transition-colors"><VscAdd size={14} /> 새 프로젝트</button>
            <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
            
            <div className="relative" ref={branchRef}>
                <div 
                    className={`flex items-center gap-1.5 text-[11px] font-mono border px-2 py-0.5 rounded cursor-pointer transition-colors shadow-sm ${isBranchOpen ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`} 
                    onClick={() => {
                        if(!activeProject) return alert("좌측 탐색기에서 시작 프로젝트를 먼저 설정해주세요!");
                        setIsBranchOpen(!isBranchOpen);
                    }}
                >
                    <VscSourceControl size={12} className="text-blue-600" />
                    <span className="font-semibold">{currentBranch}</span>
                    <VscChevronDown size={12} className="text-gray-400" />
                </div>

                {isBranchOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-300 shadow-lg rounded-md py-2 z-[9999]">
                        <div className="px-3 pb-2 border-b border-gray-100 mb-2">
                            <p className="text-xs font-bold text-gray-700 mb-1">Git Repository</p>
                            <p className="text-[10px] text-gray-500 truncate">Project: {activeProject}</p>
                        </div>
                        
<<<<<<< HEAD
=======
                        {/* 💡 [핵심] URL 연동 폼을 싹 덜어내고, 오직 로컬 브랜치 목록만 보여줍니다! */}
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
                        <div className="max-h-40 overflow-y-auto">
                            {branches.map(branch => (
                                <div 
                                    key={branch} 
                                    onClick={() => handleSelectBranch(branch)}
                                    className={`flex items-center justify-between px-4 py-1.5 cursor-pointer text-xs ${branch === currentBranch ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    <span>{branch}</span>
                                    {branch === currentBranch && <span className="text-[10px]">Active</span>}
                                </div>
                            ))}
                        </div>

                        <div className="px-3 pt-3 border-t border-gray-100 mt-2">
                            <p className="text-[10px] font-semibold text-gray-500 mb-1">Create New Branch</p>
                            <div className="flex items-center gap-1">
                                <input 
                                    type="text" 
                                    placeholder="new-branch-name" 
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                                />
                                <button 
                                    onClick={handleCreateBranch}
                                    disabled={isCreatingBranch || !newBranchName.trim()}
                                    className="bg-gray-800 text-white p-1 rounded hover:bg-black disabled:opacity-50"
                                >
                                    {isCreatingBranch ? <VscRefresh className="animate-spin" size={14} /> : <VscAdd size={14}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <span className="text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-sm select-none">Solo</span>
        </div>
      </div>
    </div>
  );
}