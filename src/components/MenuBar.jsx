import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveBranch, closeAllFiles, closeFile, openCodeMapTab } from '../store/slices/fileSystemSlice';
import { openProjectModal, setDebugMode, writeToTerminal, setActiveBottomTab, setCurrentDebugLine, updateDebugVariables, toggleSidebar, triggerEditorCmd, toggleTerminal, setCodeMapMode } from '../store/slices/uiSlice';
import { DebugSocket } from '../utils/debugSocket'; 
import { RunSocket } from '../utils/runSocket'; 
import { 
    VscBell, VscSourceControl, VscChevronDown, VscAdd, VscRefresh, 
    VscClose, VscOrganization, VscMic, VscCallOutgoing, VscAccount, VscMail, VscCopy, VscCheck, VscMute
} from "react-icons/vsc";
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

export default function MenuBar({ mode = 'personal' }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const dispatch = useDispatch();
  
  const { workspaceId, activeProject, activeBranch, fileContents, activeFileId } = useSelector(state => state.fileSystem);
  const { isTerminalVisible, breakpoints, codeMapMode } = useSelector(state => state.ui);

  const [activeMenu, setActiveMenu] = useState(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  
  // 모달창 상태 관리
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isVoiceChatModalOpen, setIsVoiceChatModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState('Member');
  const [isCopied, setIsCopied] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  
  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const branchRef = useRef(null);

  const isRelocationPage = location.pathname.includes('/relocation') || location.pathname.includes('/rearrange');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setActiveMenu(null);
      if (notiRef.current && !notiRef.current.contains(event.target)) setIsNotiOpen(false);
      if (branchRef.current && !branchRef.current.contains(event.target)) setIsBranchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 모달 닫기 (ESC)
  useEffect(() => {
      const handleEsc = (e) => {
          if (e.key === 'Escape') {
              setIsTeamModalOpen(false);
              setIsVoiceChatModalOpen(false);
              setIsInviteModalOpen(false);
          }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
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

  const handleCopyLink = () => {
      navigator.clipboard.writeText("https://vside.app/invite/v9x2K1");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
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
                  await saveFileApi(workspaceId, activeProject, activeBranch || 'master', activeFileId, content);
                  if (!isTerminalVisible) dispatch(toggleTerminal());
                  dispatch(writeToTerminal(`[System] Saved: ${activeFileId}\n`));
              } catch (error) {
                  if (!isTerminalVisible) dispatch(toggleTerminal());
                  dispatch(writeToTerminal(`[Error] Save failed: ${error.message}\n`));
              }
              break;
          case '다른 이름으로...':
          case '모두 저장':
          case '내보내기':
              if (!isTerminalVisible) dispatch(toggleTerminal());
              dispatch(writeToTerminal(`[System] ${itemName} 기능 준비 중입니다.\n`));
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
                  DebugSocket.startDebug(workspaceId, activeProject, activeBranch || 'master', activeFileId, currentFileBreakpoints);
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
                  await saveFileApi(workspaceId, activeProject, activeBranch || 'master', activeFileId, content);
                  dispatch(writeToTerminal(`\r\n[System] 코드를 자동 저장했습니다: ${activeFileId}\r\n`));
              } catch (error) {
                  dispatch(writeToTerminal(`\r\n[Error] 실행 전 자동 저장에 실패했습니다: ${error.message}\r\n`));
                  return; 
              }

              const language = getLanguageFromPath(activeFileId);
              dispatch(writeToTerminal(`[System] ${language} 환경에서 ${activeFileId} 실행을 준비합니다...\r\n`));

              const runPayload = {
                  type: 'RUN', workspaceId: workspaceId, projectName: activeProject,
                  branchName: activeBranch || 'master', filePath: activeFileId, language: language
              };

              RunSocket.connectAndRun(
                  'ws://localhost:8080/ws/run', runPayload,
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
                  body: JSON.stringify({ workspaceId: workspaceId, projectName: activeProject, branchName: activeBranch || 'master' })
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
                  a.href = url; a.download = filename; 
                  document.body.appendChild(a); a.click(); a.remove();
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

          case '전체 화면':
              dispatch(setCodeMapMode('full'));       
              dispatch(openCodeMapTab('full'));       
              break;
          case '분할 화면':
              dispatch(setCodeMapMode('split'));      
              dispatch(openCodeMapTab('split'));      
              break;

          case '정보':
          case '문서':
          case '키보드 단축키':
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
  }, [activeFileId, workspaceId, activeProject, activeBranch, fileContents, isTerminalVisible, codeMapMode]);

  // 💡 GNB 메뉴에 '자료재배치' 추가 및 라우팅 연결
  const gnbMenus = [
      { label: '대시보드', action: () => navigate('/') },
      { label: '일정관리', action: () => alert('일정관리 서비스로 이동합니다.') },
      { label: '개발일지', action: () => alert('개발일지 페이지로 이동합니다.') },
      { label: '자료재배치', action: () => navigate('/rearrange') },
      { label: '마이페이지', action: () => alert('마이페이지로 이동합니다.') },
      { label: '이용가이드', action: () => alert('이용가이드 페이지로 이동합니다.') },
  ];
  
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

  const currentBranch = activeProject ? (activeBranch || 'master') : 'No Project';

  return (
    <>
      <div className="flex flex-col w-full border-b border-gray-200 bg-white shrink-0 z-40 relative">
        
        {/* 1. 최상단 GNB 메뉴 */}
        <div className="flex items-center justify-between px-6 h-12 relative border-b border-gray-100">
          <div className="font-extrabold text-xl tracking-tight text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/')}>VSIDE</div>
          
          <div className="flex items-center gap-8 text-[13px] font-bold text-gray-500">
              {gnbMenus.map(menu => (
                  <span key={menu.label} className="cursor-pointer hover:text-gray-900 transition-colors" onClick={menu.action}>
                      {menu.label}
                  </span>
              ))}
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

        {/* 2. 에디터 하위 메뉴 */}
        {!isRelocationPage && (
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
                  
                  {/* 팀 메뉴 버튼 */}
                  {mode === 'team' && (
                      <div className="flex items-center gap-1.5 ml-3 border-l border-gray-300 pl-3 animate-fade-in">
                          <div onClick={() => setIsTeamModalOpen(true)} className="cursor-pointer px-3 py-1 rounded-md font-extrabold text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:shadow-sm active:scale-95 transition-all border border-blue-100 flex items-center gap-1.5">
                              TEAM
                          </div>
                          <div onClick={() => setIsVoiceChatModalOpen(true)} className="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-md font-extrabold text-green-600 bg-green-50/80 hover:bg-green-100 hover:shadow-sm active:scale-95 transition-all border border-green-100">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              VoiceChat
                          </div>
                      </div>
                  )}
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
                  
                  {/* 아바타 목록 및 팀 뱃지 */}
                  {mode === 'team' && (
                      <div className="relative group flex items-center cursor-help ml-2 mr-1">
                          <div className="flex -space-x-1.5">
                              <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold z-30 shadow-sm relative">
                                  노<div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
                              </div>
                              <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold z-20 shadow-sm relative">
                                  길<div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
                              </div>
                              <div className="w-7 h-7 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold z-10 shadow-sm relative opacity-60">
                                  철<div className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 border-2 border-white rounded-full"></div>
                              </div>
                          </div>
                          
                          <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 shadow-xl rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                              <p className="text-xs font-black text-gray-800 mb-3 border-b border-gray-100 pb-2">현재 접속 중인 팀원 (3)</p>
                              <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                          <span className="text-[12px] font-bold text-gray-800">노민주</span>
                                      </div>
                                      <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Me</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-[12px] font-medium text-gray-700">홍길동</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                      <span className="text-[12px] font-medium text-gray-400">김철수 <span className="text-[10px]">(오프라인)</span></span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {mode === 'team' ? (
                      <span className="text-[11px] font-black bg-blue-600 text-white border border-blue-700 px-3 py-0.5 rounded-full shadow-sm select-none tracking-wider">
                          TEAM
                      </span>
                  ) : (
                      <span className="text-[11px] font-black bg-gray-200 text-gray-500 border border-gray-300 px-3 py-0.5 rounded-full shadow-sm select-none tracking-wider">
                          SOLO
                      </span>
                  )}
              </div>
            </div>
        )}
      </div>

      {/* 팀 관리 모달 */}
      {isTeamModalOpen && mode === 'team' && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-center animate-fade-in" onClick={() => setIsTeamModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden flex flex-col animate-slide-up ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                      <h2 className="text-lg font-black text-gray-900">팀원 관리 <span className="text-blue-500 ml-1">3</span></h2>
                      <button onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><VscClose size={20}/></button>
                  </div>
                  <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto bg-gray-50/50 custom-scrollbar">
                      {[
                          { name: '노민주', role: 'Owner (나)', color: 'bg-blue-500', status: '온라인' },
                          { name: '김철수', role: 'Admin', color: 'bg-teal-500', status: '온라인' },
                          { name: '이영희', role: 'Member', color: 'bg-indigo-500', status: '온라인' },
                      ].map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md hover:ring-2 hover:ring-blue-50 transition-all group cursor-default">
                              <div className="flex items-center gap-3.5">
                                  <div className="relative">
                                      <div className={`w-10 h-10 rounded-full ${user.color} text-white flex items-center justify-center font-bold text-[14px] shadow-sm`}>{user.name[0]}</div>
                                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                  </div>
                                  <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-[13px] text-gray-900">{user.name}</span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${idx === 0 ? 'bg-blue-100 text-blue-700' : idx === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                                      </div>
                                      <span className="text-[11px] text-gray-500 mt-0.5">{user.name === '노민주' ? 'you@vside.app' : 'teammate@vside.app'}</span>
                                  </div>
                              </div>
                              {idx !== 0 && <button className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><VscClose size={18}/></button>}
                          </div>
                      ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-white">
                      <button onClick={() => { setIsInviteModalOpen(true); setIsTeamModalOpen(false); }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all">
                          <VscAdd size={16} strokeWidth={1} /> 새로운 팀원 초대하기
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 초대장 발송 모달창 */}
      {isInviteModalOpen && mode === 'team' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in" onClick={() => setIsInviteModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden flex flex-col animate-slide-up ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
                      <div>
                          <h2 className="text-lg font-black text-gray-900">팀원 초대</h2>
                          <p className="text-xs text-gray-500 mt-1">이메일로 초대하거나 링크를 공유하세요</p>
                      </div>
                      <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><VscClose size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-7 bg-gray-50/50">
                      <div className="space-y-5">
                          <div className="space-y-1.5">
                              <label className="text-[13px] font-extrabold text-gray-800">초대할 이메일 주소</label>
                              <input type="text" placeholder="teammate@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-white transition-all shadow-sm" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[13px] font-extrabold text-gray-800">역할(Role) 선택</label>
                              <div className="grid grid-cols-3 gap-3">
                                  {['Owner', 'Admin', 'Member'].map(role => (
                                      <button 
                                          key={role} 
                                          onClick={() => setInviteRole(role)}
                                          className={`py-2.5 rounded-xl text-[12px] font-bold transition-all border-2 relative overflow-hidden ${
                                              inviteRole === role 
                                              ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
                                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                          }`}
                                      >
                                          {role}
                                          <span className={`block text-[10px] font-medium mt-0.5 ${inviteRole === role ? 'text-blue-500' : 'text-gray-400'}`}>
                                              {role === 'Owner' ? '모든 권한' : role === 'Admin' ? '관리자 권한' : '편집 권한'}
                                          </span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <button className="w-full py-3.5 bg-[#2d333b] hover:bg-black text-white rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
                              <VscMail size={16} /> 초대장 발송하기
                          </button>
                      </div>

                      <div className="flex items-center gap-4">
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <span className="text-[11px] font-bold text-gray-400">또는</span>
                          <div className="h-px bg-gray-200 flex-1"></div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[13px] font-extrabold text-gray-800">초대 링크 복사</label>
                          <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[12px] text-gray-600 truncate font-mono shadow-sm select-all">
                                  https://vside.app/invite/v9x2K1
                              </div>
                              <button 
                                  onClick={handleCopyLink}
                                  className={`px-5 py-3 rounded-xl flex items-center gap-1.5 text-[12px] font-bold shrink-0 transition-all shadow-sm ${isCopied ? 'bg-green-500 text-white border-transparent' : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 active:scale-95'}`}
                              >
                                  {isCopied ? <><VscCheck size={14}/> 복사됨</> : <><VscCopy size={14}/> 복사</>}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 보이스챗 모달창 */}
      {isVoiceChatModalOpen && mode === 'team' && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in" onClick={() => setIsVoiceChatModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden flex flex-col animate-slide-up ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-green-50/50">
                      <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> 보이스 챗
                      </h2>
                      <button onClick={() => setIsVoiceChatModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-white hover:bg-gray-100 p-1.5 rounded-full transition-colors shadow-sm"><VscClose size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div>
                          <h3 className="text-xs font-extrabold text-green-600 mb-4 bg-green-100 px-2.5 py-1 rounded-md inline-block">참여중 2명</h3>
                          <div className="space-y-3">
                              <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:border-green-300 transition-colors">
                                  <div className="flex items-center gap-3.5">
                                      <div className="relative">
                                          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-[14px] font-bold shadow-sm ring-2 ring-green-400 z-10 relative">노</div>
                                          <div className="absolute -inset-1.5 border-2 border-green-400 rounded-full animate-ping opacity-75"></div>
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="text-[13px] font-extrabold text-gray-900">노민주 <span className="text-[10px] font-normal text-gray-400 ml-0.5">(나)</span></span>
                                          <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-0.5"><VscMic size={11}/> Speaking...</span>
                                      </div>
                                  </div>
                                  <button className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                                      <VscMic size={16}/>
                                  </button>
                              </div>
                              
                              <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm transition-colors">
                                  <div className="flex items-center gap-3.5">
                                      <div className="w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center text-[14px] font-bold shadow-sm opacity-90">김</div>
                                      <div className="flex flex-col">
                                          <span className="text-[13px] font-extrabold text-gray-900">김철수</span>
                                          <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5"><VscMute size={11}/> Muted</span>
                                      </div>
                                  </div>
                                  <input type="range" min="0" max="100" defaultValue="70" className="w-20 accent-teal-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                              </div>
                          </div>
                      </div>
                      
                      <div className="h-px bg-gray-100"></div>
                      
                      <div>
                          <h3 className="text-xs font-bold text-gray-400 mb-4 px-1">대기중 2명</h3>
                          <div className="space-y-3 px-1">
                              <div className="flex items-center gap-3.5 opacity-50 grayscale">
                                  <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-[12px] font-bold"><VscAccount size={16}/></div>
                                  <span className="text-[12px] font-bold text-gray-600">이영희</span>
                              </div>
                              <div className="flex items-center gap-3.5 opacity-50 grayscale">
                                  <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-[12px] font-bold"><VscAccount size={16}/></div>
                                  <span className="text-[12px] font-bold text-gray-600">강세균</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}