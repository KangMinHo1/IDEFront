import React, { useState } from 'react';
import { VscClose, VscFolderOpened } from "react-icons/vsc";
import DirectoryPickerModal from './DirectoryPickerModal'; // [New]

export default function CreateWorkspaceModal({ onClose, onCreate }) {
    const [name, setName] = useState('');
    const [path, setPath] = useState('');
    const [desc, setDesc] = useState('');
    const [showPicker, setShowPicker] = useState(false); // [New] 탐색기 표시 여부

    const handleSubmit = () => {
        if(!name) return alert("워크스페이스 이름을 입력해주세요.");
        onCreate(name, path, desc); 
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">워크스페이스 생성</h2>
                        <button onClick={onClose}><VscClose size={24} className="text-gray-400 hover:text-black"/></button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">워크스페이스 이름</label>
                            <input 
                                autoFocus
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition"
                                placeholder="예: MyStudy, ProjectAlpha"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">저장 경로 (서버)</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition font-mono text-gray-600"
                                    placeholder="비워두면 기본 경로에 저장됩니다."
                                    value={path} 
                                    onChange={e => setPath(e.target.value)}
                                />
                                {/* [New] 경로 찾기 버튼 */}
                                <button 
                                    onClick={() => setShowPicker(true)}
                                    className="px-4 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                                    title="서버 폴더 찾아보기"
                                >
                                    <VscFolderOpened size={20}/>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">설명 (선택)</label>
                            <input 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition"
                                placeholder="어떤 공간인지 설명해주세요"
                                value={desc} onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-100 transition">취소</button>
                        <button onClick={handleSubmit} className="px-5 py-2.5 rounded-lg bg-black text-white text-sm font-bold hover:bg-gray-800 transition">생성하기</button>
                    </div>
                </div>
            </div>

            {/* [New] 디렉토리 선택 모달 */}
            {showPicker && (
                <DirectoryPickerModal 
                    onClose={() => setShowPicker(false)}
                    onSelect={(selectedPath) => setPath(selectedPath)}
                />
            )}
        </>
    );
}