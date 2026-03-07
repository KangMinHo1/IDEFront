// src/components/IdeMain.jsx
import React, { useEffect, useState, useRef } from 'react';
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

// 기존 API / 소켓 임포트 유지
import { fetchWorkspaceProjectsApi } from '../utils/api'; 
import { setWorkspaceTree, setWorkspaceId, setProjectList } from '../store/slices/fileSystemSlice'; 
import { setDebugMode, setCurrentDebugLine, updateDebugVariables, writeToTerminal } from '../store/slices/uiSlice'; 
import { DebugSocket } from '../utils/debugSocket'; 

import { VscClose, VscWand, VscCommentDiscussion, VscAccount, VscAdd, VscMail, VscCopy, VscCheck, VscSend, VscMic, VscMute } from 'react-icons/vsc';

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">My Page Panel</div>;

export default function IdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const chatScrollRef = useRef(null);
  
  const { 
    isSidebarVisible, isTerminalVisible, isAgentVisible, 
    activeActivity, isDebugMode, isCodeMapVisible, codeMapMode 
  } = useSelector(state => state.ui);

  const [isTeamMode, setIsTeamMode] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isVoiceChatModalOpen, setIsVoiceChatModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [rightTab, setRightTab] = useState('ai'); 
  
  const [inviteRole, setInviteRole] = useState('Member');
  const [isCopied, setIsCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // =========================================================
  // 💡 [새로 추가됨] 채팅 메시지 상태 관리 (기본 대화 내용 세팅)
  // =========================================================
  const [chatMessages, setChatMessages] = useState([
      { id: 1, sender: '김철수', avatar: '김', color: 'bg-teal-500', text: 'API 문서 작성 완료했습니다! 확인 부탁드려요. 👍', time: '오후 2:30', isMine: false },
      { id: 2, sender: '이영희', avatar: '이', color: 'bg-indigo-500', text: '확인했어요. 프론트 연동 준비되면 바로 알려주세요~', time: '오후 2:32', isMine: false },
      { id: 3, sender: '나', avatar: '', color: '', text: '넵 지금 바로 연동 시작하겠습니다! 🔥', time: '오후 2:35', isMine: true }
  ]);

  useEffect(() => {
      if (!isTeamMode && rightTab === 'chat') {
          setRightTab('ai');
          setIsTeamModalOpen(false); setIsVoiceChatModalOpen(false); setIsInviteModalOpen(false);
      }
  }, [isTeamMode, rightTab]);

  useEffect(() => {
      if (rightTab === 'chat' && chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
  }, [rightTab]);

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

  const loadWorkspaceData = async (workspaceId) => {
      try {
          const projectsRoot = await fetchWorkspaceProjectsApi(workspaceId);
          dispatch(setProjectList(projectsRoot.children || []));
          dispatch(setWorkspaceTree(projectsRoot));
      } catch (e) { console.error("Failed to load workspace data:", e); }
  };

  useEffect(() => { if (id) { dispatch(setWorkspaceId(id)); loadWorkspaceData(id); } }, [id, dispatch]);

  useEffect(() => {
      let isMounted = true; 
      let timer = null;
      const connectDebugSocket = () => {
          DebugSocket.connect('ws://localhost:8080/ws/debug', () => {}, (msg) => {
                  try {
                      const data = JSON.parse(msg);
                      if (data.type === 'SUSPENDED') { dispatch(setCurrentDebugLine({ line: data.line, path: data.path })); dispatch(updateDebugVariables(data.variables || {})); } 
                      else if (data.type === 'OUTPUT' || data.type === 'ERROR') { dispatch(writeToTerminal((data.data || '') + '\n')); if (data.data && data.data.includes('Debugging Finished')) { dispatch(setDebugMode(false)); } }
                  } catch (e) {}
              }, () => { if (!isMounted) return; dispatch(setDebugMode(false)); timer = setTimeout(connectDebugSocket, 1000); }
          );
      };
      connectDebugSocket();
      return () => { isMounted = false; clearTimeout(timer); DebugSocket.disconnect(); };
  }, [dispatch]); 

  const handleCopyLink = () => {
      navigator.clipboard.writeText("https://vside.app/invite/v9x2K1");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
  };

  // =========================================================
  // 💡 [새로 추가됨] 메시지 전송 실행 함수
  // =========================================================
  const handleSendMessage = () => {
      if (chatInput.trim() !== '') {
          // 현재 시간 구하기
          const now = new Date();
          let hours = now.getHours();
          const minutes = now.getMinutes();
          const ampm = hours >= 12 ? '오후' : '오전';
          hours = hours % 12;
          hours = hours ? hours : 12; // 0시는 12시로 표시
          const formattedTime = `${ampm} ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;

          // 새 메시지 객체 생성
          const newMessage = {
              id: Date.now(),
              sender: '나',
              avatar: '',
              color: '',
              text: chatInput.trim(),
              time: formattedTime,
              isMine: true
          };

          // 말풍선 목록에 추가하고 입력창 비우기
          setChatMessages(prev => [...prev, newMessage]);
          setChatInput('');

          // 렌더링 직후 맨 아래로 스크롤 이동
          setTimeout(() => {
              if (chatScrollRef.current) {
                  chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
              }
          }, 50);
      }
  };

  const handleChatKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); 
          handleSendMessage();
      }
  };

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
                    {isSidebarVisible && (
                        <div className="w-64 shrink-0 border-r border-gray-200 bg-[#f8f9fa]">
                            <Sidebar />
                        </div>
                    )}
                    
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

                    {isCodeMapVisible && codeMapMode === 'split' && (
                        <div className="flex-1 min-w-[300px] border-l border-gray-200 z-10 bg-white relative">
                            <CodeMap />
                        </div>
                    )}

                    {isDebugMode ? (
                        <div className="w-[300px] shrink-0 border-l border-gray-200 z-20 bg-[#252526]">
                            <DebugPanel />
                        </div>
                    ) : (
                        (isAgentVisible || isTeamMode) && (
                            <div className="w-[320px] bg-[#f8f9fa] border-l border-gray-200 flex flex-col shrink-0 z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] transition-all duration-300">
                                <div className="flex h-12 bg-white border-b border-gray-200 shrink-0 px-2 pt-2 gap-1">
                                    <button onClick={() => setRightTab('ai')} className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold rounded-t-lg transition-colors ${rightTab === 'ai' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        <VscWand size={16} /> AI 어시스트
                                    </button>
                                    {isTeamMode && (
                                        <button onClick={() => setRightTab('chat')} className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold rounded-t-lg transition-colors animate-fade-in ${rightTab === 'chat' ? 'text-green-600 bg-green-50/50 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                                            <VscCommentDiscussion size={16} /> 팀 채팅
                                            <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center -ml-0.5 mt-0.5 shadow-sm">2</span>
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {rightTab === 'chat' && isTeamMode ? (
                                        <div className="flex-1 flex flex-col bg-[#f4f5f7] animate-fade-in">
                                            {/* 💡 [말풍선 렌더링 영역] map 함수를 이용해 동적으로 그려줍니다! */}
                                            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-5 custom-scrollbar text-[12px]">
                                                <div className="text-center my-2"><span className="bg-black/5 border border-black/5 text-gray-500 font-medium text-[10px] px-3 py-1 rounded-full">2026년 3월 8일 일요일</span></div>
                                                
                                                {chatMessages.map(msg => (
                                                    msg.isMine ? (
                                                        /* 내가 보낸 메시지 */
                                                        <div key={msg.id} className="flex gap-2.5 max-w-[85%] ml-auto justify-end animate-fade-in">
                                                            <div className="flex flex-col gap-1 items-end">
                                                                <div className="bg-blue-500 border border-blue-600 p-3 rounded-2xl rounded-tr-sm shadow-sm text-white leading-relaxed">
                                                                    {msg.text.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-medium mr-1">{msg.time}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* 상대방이 보낸 메시지 */
                                                        <div key={msg.id} className="flex gap-2.5 max-w-[85%] animate-fade-in">
                                                            <div className={`w-8 h-8 rounded-full ${msg.color} text-white flex items-center justify-center font-bold text-[12px] shadow-sm shrink-0`}>{msg.avatar}</div>
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className="font-bold text-gray-700 text-[11px] ml-1">{msg.sender}</span>
                                                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm text-gray-800 leading-relaxed">
                                                                    {msg.text}
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-medium ml-1">{msg.time}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                            
                                            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex items-end gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
                                                <textarea 
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={handleChatKeyDown}
                                                    placeholder="메시지를 입력하세요... (Enter 전송)" 
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[12px] outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-400 transition-all resize-none h-[40px] max-h-[100px] overflow-y-auto" 
                                                />
                                                {/* 버튼 클릭 시에도 전송되도록 변경 */}
                                                <button 
                                                    onClick={handleSendMessage}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm ${chatInput.trim() ? 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <VscSend size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col bg-[#fbfbfc] animate-fade-in relative">
                                            {isAgentVisible ? <AgentPanel /> : (
                                                <div className="p-5 flex-1 overflow-y-auto">
                                                    <p className="text-xs text-gray-500 mb-6 leading-relaxed">코드에 대해 질문하거나 도움을 요청하세요</p>
                                                    <div className="space-y-3">
                                                        <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:ring-2 hover:ring-blue-50 hover:bg-blue-50 text-[13px] font-bold text-gray-700 text-left transition-all">📝 코드 설명해줘</button>
                                                        <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:ring-2 hover:ring-blue-50 hover:bg-blue-50 text-[13px] font-bold text-gray-700 text-left transition-all">✨ 리팩토링 제안</button>
                                                        <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:ring-2 hover:ring-blue-50 hover:bg-blue-50 text-[13px] font-bold text-gray-700 text-left transition-all">🐛 버그 찾기</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
      
      <MenuBar 
          isTeamMode={isTeamMode} toggleTeamMode={() => setIsTeamMode(!isTeamMode)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)} onOpenVoiceChatModal={() => setIsVoiceChatModalOpen(true)} 
      />
      
      <div className="flex-1 flex overflow-hidden relative">
         <ActivityBar />
         {renderMainContent()}
         {isCodeMapVisible && codeMapMode === 'full' && <div className="absolute inset-0 left-12 z-[100] bg-white"><CodeMap /></div>}
      </div>

      {isTeamModalOpen && isTeamMode && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[9998] flex items-center justify-center animate-fade-in" onClick={() => setIsTeamModalOpen(false)}>
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
                      <button onClick={() => setIsInviteModalOpen(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all">
                          <VscAdd size={16} strokeWidth={1} /> 새로운 팀원 초대하기
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isInviteModalOpen && isTeamMode && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in" onClick={() => setIsInviteModalOpen(false)}>
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

      {isVoiceChatModalOpen && isTeamMode && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fade-in" onClick={() => setIsVoiceChatModalOpen(false)}>
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
    </div>
  );
}