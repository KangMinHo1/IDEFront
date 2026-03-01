import React, { useState } from 'react';
import { VscSend } from "react-icons/vsc";

export default function AgentPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: '무엇을 도와드릴까요? 선택한 코드에 대한 설명을 해드리거나, 리팩토링을 제안해 드릴 수 있습니다.' }]);
    }, 800);
  };

  const suggestionButtons = [
      { icon: "📝", text: "코드 설명해줘" },
      { icon: "✨", text: "리팩토링 제안" },
      { icon: "🐛", text: "버그 찾기" }
  ];

  return (
    <div className="h-full bg-white flex flex-col font-sans border-l border-gray-200">
      {/* 헤더 */}
      <div className="h-9 px-4 flex items-center justify-between text-[13px] font-bold text-gray-800 bg-[#f8f9fa] border-b border-gray-200">
        <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg font-black">A</span>
            <span>AI 코드 어시스트</span>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#fbfbfc]">
        {messages.length === 0 ? (
            <div className="flex flex-col gap-2 mt-2">
                <div className="text-xs text-gray-500 mb-4 px-1">
                    <strong>AI 어시스트</strong><br/>
                    코드에 대해 질문하거나 도움을 요청하세요
                </div>
                
                {suggestionButtons.map((btn, idx) => (
                    <button 
                        key={idx}
                        className="bg-white border border-gray-200 p-2.5 rounded text-left text-[13px] text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm"
                        onClick={() => { setInput(btn.text); handleSend(); }}
                    >
                        <span>{btn.icon}</span> {btn.text}
                    </button>
                ))}
            </div>
        ) : (
            <div className="space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-2.5 rounded-lg text-[13px] shadow-sm
                            ${msg.role === 'ai' 
                                ? 'bg-white text-gray-800 border border-gray-200' 
                                : 'bg-blue-50 text-blue-900 border border-blue-100'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded focus-within:border-blue-500 px-3 py-2 transition-all shadow-inner">
          <input 
            className="flex-1 bg-transparent border-none outline-none text-gray-800 text-[13px] placeholder-gray-400"
            placeholder="AI에게 질문하기..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <VscSend 
            className={`cursor-pointer text-lg transition-colors ${input.trim() ? 'text-blue-600' : 'text-gray-300'}`} 
            onClick={handleSend} 
          />
        </div>
      </div>
    </div>
  );
}