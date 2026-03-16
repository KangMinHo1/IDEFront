import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveBranch, closeAllFiles, closeFile, openCodeMapTab } from '../store/slices/fileSystemSlice';
import { openProjectModal, setDebugMode, writeToTerminal, setActiveBottomTab, triggerEditorCmd, toggleTerminal, toggleSidebar, setCodeMapMode } from '../store/slices/uiSlice';
import { DebugSocket } from '../utils/debugSocket'; 
import { RunSocket } from '../utils/runSocket'; 
import { 
    VscBell, VscSourceControl, VscChevronDown, VscAdd, VscRefresh, 
    VscClose, VscOrganization, VscMic, VscAccount, VscMail, VscCopy, VscCheck, VscMute, VscKey
} from "react-icons/vsc";
// 💡 [수정] getUserProfileApi 임포트 추가!
import { fetchBranchListApi, createBranchApi, saveFileApi, getWorkspaceMembersApi, inviteWorkspaceMemberApi, getUserProfileApi } from '../utils/api'; 
import { useAuth } from '../utils/AuthContext'; 

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

const avatarColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];

export default function MenuBar({ mode = 'personal' }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const dispatch = useDispatch();
  const { user } = useAuth(); 
  
  // 💡 [NEW] 확실한 내 프로필 상태 저장
  const [myProfile, setMyProfile] = useState(null);

  const { workspaceId, activeProject, activeBranch, fileContents, activeFileId } = useSelector(state => state.fileSystem);
  const { isTerminalVisible, breakpoints, codeMapMode } = useSelector(state => state.ui);

  const [activeMenu, setActiveMenu] = useState(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isVoiceChatModalOpen, setIsVoiceChatModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState([]);

  const menuRef = useRef(null);
  const notiRef = useRef(null);
  const branchRef = useRef(null);

  const isRelocationPage = location.pathname.includes('/relocation') || location.pathname.includes('/rearrange');

  // 💡 [NEW] 컴포넌트 마운트 시 내 프로필 정보 확실하게 땡겨오기
  useEffect(() => {
      if (user && user.id) {
          getUserProfileApi(user.id)
              .then(profile => setMyProfile(profile))
              .catch(err => console.error("프로필 정보를 불러오지 못했습니다.", err));
      }
  }, [user]);

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

  useEffect(() => {
      if (mode === 'team' && workspaceId) {
          getWorkspaceMembersApi(workspaceId)
              .then(members => setTeamMembers(members))
              .catch(err => console.error("팀원 목록 로드 실패:", err));
      }
  }, [mode, workspaceId, isTeamModalOpen]);

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

  const handleCopyCode = () => {
      if (!workspaceId) return alert("워크스페이스 ID를 찾을 수 없습니다.");
      navigator.clipboard.writeText(workspaceId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
  };

  const handleSendInvite = async () => {
      if (!inviteEmail.trim()) return alert("초대할 이메일 주소를 입력해주세요.");
      try {
          setIsInviting(true);
          await inviteWorkspaceMemberApi(workspaceId, inviteEmail);
          alert(`✨ ${inviteEmail} 님에게 초대장을 발송했습니다!`);
          setInviteEmail(""); 
          setIsInviteModalOpen(false); 
      } catch (e) {
          alert("초대 실패: " + e.message);
      } finally {
          setIsInviting(false);
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
              if(typeof openCodeMapTab === 'function') dispatch(openCodeMapTab('full'));       
              break;
          case '분할 화면':
              dispatch(setCodeMapMode('split'));      
              if(typeof openCodeMapTab === 'function') dispatch(openCodeMapTab('split'));      
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

  // 💡 [NEW] 렌더링에 사용할 실제 이름 추출
  const displayNickname = myProfile?.nickname || user?.nickname || '사용자';
  const displayInitial = displayNickname[0] || '유';

  return (
    <>
      <div className="flex flex-col w-full border-b border-gray-200 bg-white shrink-0 z-[1000] relative">
        
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
             {/* 💡 [FIX] 상단 내 프로필 표시 완벽 적용! */}
             <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                 <div className="w-7 h-7 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center text-xs text-blue-700 font-bold">
                     {displayInitial}
                 </div>
                 <span>{displayNickname} 님</span>
             </div>
          </div>
        </div>

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
                  
                  {mode === 'team' && (
                      <div className="relative group flex items-center cursor-help ml-2 mr-1">
                          <div className="flex -space-x-1.5">
                              {teamMembers.slice(0, 3).map((member, idx) => (
                                  <div key={member.userId} className={`w-7 h-7 rounded-full ${avatarColors[idx % avatarColors.length]} border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm relative z-${30 - idx * 10}`}>
                                      {member.nickname?.[0]}
                                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
                                  </div>
                              ))}
                              {teamMembers.length > 3 && (
                                  <div className="w-7 h-7 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold z-0 shadow-sm relative">
                                      +{teamMembers.length - 3}
                                  </div>
                              )}
                          </div>
                          
                          <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 shadow-xl rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[9999]">
                              <p className="text-xs font-black text-gray-800 mb-3 border-b border-gray-100 pb-2">팀원 ({teamMembers.length})</p>
                              <div className="space-y-2">
                                  {teamMembers.map((member) => (
                                      <div key={member.userId} className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                              <span className="text-[12px] font-bold text-gray-800 truncate max-w-[80px]">{member.nickname}</span>
                                          </div>
                                          {user?.id === member.userId && <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Me</span>}
                                      </div>
                                  ))}
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

      {isTeamModalOpen && mode === 'team' && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-center animate-fade-in" onClick={() => setIsTeamModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden flex flex-col animate-slide-up ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                      <h2 className="text-lg font-black text-gray-900">팀원 관리 <span className="text-blue-500 ml-1">{teamMembers.length}</span></h2>
                      <button onClick={() => setIsTeamModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><VscClose size={20}/></button>
                  </div>
                  <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto bg-gray-50/50 custom-scrollbar">
                      {teamMembers.map((member, idx) => {
                          const isMe = user?.id === member.userId;
                          return (
                              <div key={member.userId} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md hover:ring-2 hover:ring-blue-50 transition-all group cursor-default">
                                  <div className="flex items-center gap-3.5">
                                      <div className="relative">
                                          <div className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} text-white flex items-center justify-center font-bold text-[14px] shadow-sm`}>{member.nickname?.[0]}</div>
                                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                      </div>
                                      <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-[13px] text-gray-900">{member.nickname}</span>
                                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${member.role === 'OWNER' ? 'bg-blue-100 text-blue-700' : member.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                                  {member.role === 'OWNER' ? 'Owner' : member.role === 'ADMIN' ? 'Admin' : 'Member'} {isMe && '(나)'}
                                              </span>
                                          </div>
                                          <span className="text-[11px] text-gray-500 mt-0.5">{member.email}</span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-white">
                      <button onClick={() => { setIsInviteModalOpen(true); setIsTeamModalOpen(false); }} className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all">
                          <VscAdd size={16} strokeWidth={1} /> 새로운 팀원 초대하기
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isInviteModalOpen && mode === 'team' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in" onClick={() => setIsInviteModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden flex flex-col animate-slide-up ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
                      <div>
                          <h2 className="text-lg font-black text-gray-900">팀원 초대</h2>
                          <p className="text-xs text-gray-500 mt-1">이메일 발송 또는 프로젝트 코드로 초대하세요</p>
                      </div>
                      <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><VscClose size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-7 bg-gray-50/50">
                      <div className="space-y-4">
                          <div className="space-y-1.5">
                              <label className="text-[13px] font-extrabold text-gray-800 flex items-center gap-1.5"><VscMail className="text-blue-500"/> 이메일로 초대장 발송</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      value={inviteEmail}
                                      onChange={(e) => setInviteEmail(e.target.value)}
                                      onKeyDown={(e) => { if(e.key === 'Enter') handleSendInvite(); }}
                                      placeholder="teammate@example.com" 
                                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 bg-white transition-all shadow-sm" 
                                  />
                                  <button 
                                      onClick={handleSendInvite}
                                      disabled={isInviting || !inviteEmail.trim()}
                                      className="px-5 bg-[#2d333b] hover:bg-black text-white rounded-xl text-[13px] font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center shrink-0"
                                  >
                                      {isInviting ? <VscRefresh className="animate-spin" size={16}/> : '발송'}
                                  </button>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-4">
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <span className="text-[11px] font-bold text-gray-400">또는</span>
                          <div className="h-px bg-gray-200 flex-1"></div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[13px] font-extrabold text-gray-800 flex items-center gap-1.5"><VscKey className="text-green-500"/> 프로젝트 코드 공유</label>
                          <p className="text-[11px] text-gray-500">새로운 팀원이 대시보드에서 이 코드를 입력하여 참여할 수 있습니다.</p>
                          <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[13px] text-gray-700 truncate font-mono shadow-sm select-all font-bold tracking-wider text-center">
                                  {workspaceId || "PROJ-XXXX-YYYY"}
                              </div>
                              <button 
                                  onClick={handleCopyCode}
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
                      <div className="text-center text-gray-500 font-bold text-sm">
                          보이스챗 소켓 연동 대기 중입니다... 🎤
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}