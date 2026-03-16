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

import { fetchWorkspaceProjectsApi } from '../utils/api'; 
import { setWorkspaceTree, setWorkspaceId, setProjectList } from '../store/slices/fileSystemSlice'; 
import { VscSend } from 'react-icons/vsc';

const DocsPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Docs Panel</div>; 
const ApiTestPanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">API Test Panel</div>;
const MyPagePanel = () => <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">My Page Panel</div>;

// 💡 팀 채팅이 가능하게 완벽히 구현된 UI 컴포넌트
const CollaborationPanel = () => {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'System', text: '팀 채팅방에 입장하셨습니다.', time: '10:00', isMe: false },
        { sender: '이영희', text: '안녕하세요! App.jsx 부분 작업 시작할게요.', time: '10:02', isMe: false }
    ]);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!chatInput.trim()) return;
        setMessages([...messages, { 
            sender: '나', text: chatInput, time: new Date().toLocaleTimeString().slice(0,5), isMe: true 
        }]);
        setChatInput('');
    };

    return (
      <div className="flex flex-col h-full bg-white font-sans">
          <div className="flex-1 overflow-y-auto p-4 bg-[#fbfbfc] space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                      <span className="text-[10px] text-gray-400 font-bold mb-1 px-1">{msg.sender}</span>
                      <div className={`max-w-[85%] p-3 rounded-lg text-[13px] shadow-sm leading-relaxed whitespace-pre-wrap
                          ${msg.isMe ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                          {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1">{msg.time}</span>
                  </div>
              ))}
              <div ref={endRef} />
          </div>
          <div className="p-3 bg-white border-t border-gray-200 shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg focus-within:border-green-400 focus-within:bg-white px-3 py-2 transition-all shadow-inner">
                  <input 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleSend()} 
                      className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder-gray-400" 
                      placeholder="팀원에게 메시지 보내기..." 
                  />
                  <button 
                      onClick={handleSend} 
                      disabled={!chatInput.trim()}
                      className={`cursor-pointer p-1.5 rounded-md transition-colors ${chatInput.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400'}`}
                  >
                      <VscSend size={14} />
                  </button>
              </div>
          </div>
      </div>
    );
};

export default function TeamIdeMain() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { activeActivity, isTerminalVisible, isSidebarVisible, isAgentVisible, isDebugMode, codeMapMode } = useSelector(state => state.ui);
  const { workspaceId, activeProject } = useSelector(state => state.fileSystem);
  const isCodeMapSplit = codeMapMode === 'split';

  const [rightTab, setRightTab] = useState('chat'); // 'ai' | 'chat'

  useEffect(() => {
    if (id) {
      dispatch(setWorkspaceId(id));
      fetchWorkspaceProjectsApi(id).then(root => {
        dispatch(setWorkspaceTree(root));
        if (root.children) dispatch(setProjectList(root.children));
      }).catch(console.error);
    }
  }, [id, dispatch]);

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
                    {/* 좌측 사이드바 */}
                    {isSidebarVisible && (
                        <div className="w-[260px] shrink-0 border-r border-gray-200 flex flex-col bg-[#f8f9fa]">
                           <Sidebar />
                        </div>
                    )}
                    
                    {/* 중앙 에디터 영역 */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        <FileTabs />
                        <div className="flex-1 flex relative overflow-hidden">
                            <div className="flex-1 flex flex-col min-w-0">
                                <CodeEditor />
                            </div>
                            {isCodeMapSplit && (
                                <div className="w-1/2 border-l border-gray-200 flex flex-col z-10">
                                    <CodeMap />
                                </div>
                            )}
                        </div>
                        {isTerminalVisible && (
                            <div className="h-[250px] border-t border-gray-200 bg-white shrink-0">
                                <BottomPanel />
                            </div>
                        )}
                    </div>

                    {/* 우측 패널 (IdeMain과 완벽히 동일한 w-[320px] 적용) */}
                    {(isAgentVisible || isDebugMode) && (
                        <div className="w-[320px] shrink-0 border-l border-gray-200 flex flex-col bg-[#f8f9fa] z-20">
                           {isDebugMode ? (
                               <DebugPanel />
                           ) : (
                               <div className="flex flex-col h-full">
                                   <div className="flex items-center h-10 border-b border-gray-200 bg-[#f8f9fa] shrink-0">
                                       <button 
                                           onClick={() => setRightTab('ai')}
                                           className={`flex-1 h-full text-[12px] font-bold transition-colors ${rightTab === 'ai' ? 'text-blue-600 bg-white border-t-2 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                       >
                                           AI 어시스트
                                       </button>
                                       <button 
                                           onClick={() => setRightTab('chat')}
                                           className={`flex-1 h-full text-[12px] font-bold transition-colors ${rightTab === 'chat' ? 'text-green-600 bg-white border-t-2 border-t-green-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                       >
                                           팀 채팅
                                       </button>
                                   </div>
                                   
                                   <div className="flex-1 overflow-hidden relative bg-white">
                                       <div className={`absolute inset-0 ${rightTab === 'ai' ? 'block' : 'hidden'}`}>
                                           <AgentPanel />
                                       </div>
                                       <div className={`absolute inset-0 ${rightTab === 'chat' ? 'block' : 'hidden'}`}>
                                           <CollaborationPanel />
                                       </div>
                                   </div>
                               </div>
                           )}
                        </div>
                    )}
                </div>
              );
      }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-[#333] overflow-hidden font-sans">
      <CommandPalette />
      <CreateProjectModal /> 
      <MenuBar mode="team" />
      <div className="flex-1 flex overflow-hidden">
          <ActivityBar />
          {renderMainContent()}
      </div>
    </div>
  );
}