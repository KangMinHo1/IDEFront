import React, { useState, useEffect } from 'react';
import { VscClose, VscFolder, VscArrowUp, VscServer } from "react-icons/vsc";
import { fetchSystemRootsApi, fetchSubFoldersApi } from '../utils/api';

export default function DirectoryPickerModal({ onClose, onSelect }) {
    const [currentPath, setCurrentPath] = useState(''); // 현재 보고 있는 경로
    const [items, setItems] = useState([]); // 폴더 목록
    const [roots, setRoots] = useState([]); // 드라이브 목록 (C:, D: ...)
    const [loading, setLoading] = useState(false);

    // 1. 처음 켜지면 드라이브 목록 로드
    useEffect(() => {
        loadRoots();
    }, []);

    const loadRoots = async () => {
        setLoading(true);
        try {
            const data = await fetchSystemRootsApi();
            setRoots(data);
            setCurrentPath(''); // 루트 상태
        } catch (e) {
            alert("드라이브 로드 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadFolders = async (path) => {
        setLoading(true);
        try {
            const data = await fetchSubFoldersApi(path);
            setItems(data);
            setCurrentPath(path);
        } catch (e) {
            alert("폴더 접근 불가 (권한이 없거나 경로가 잘못됨)");
        } finally {
            setLoading(false);
        }
    };

    const handleUp = () => {
        // 상위 폴더로 이동 로직 (간단 구현)
        // 윈도우 기준: "C:\Users\Name" -> "C:\Users"
        if (!currentPath) return;
        
        // 드라이브 루트인 경우 (예: "C:\") 다시 루트 선택 화면으로
        if (roots.includes(currentPath) || currentPath.length <= 3) {
            setCurrentPath('');
            setItems([]);
            return;
        }

        // 경로 파싱하여 상위 경로 계산
        const separator = currentPath.includes('/') ? '/' : '\\';
        const lastIndex = currentPath.lastIndexOf(separator);
        const parentPath = currentPath.substring(0, lastIndex) || (currentPath.includes(':') ? currentPath.substring(0, 3) : '');
        
        loadFolders(parentPath);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] h-[600px] flex flex-col overflow-hidden">
                
                {/* 헤더 */}
                <div className="h-14 px-5 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <VscFolder className="text-yellow-500"/> 경로 선택
                    </h3>
                    <button onClick={onClose}><VscClose size={20} className="text-gray-400 hover:text-black"/></button>
                </div>

                {/* 현재 경로 표시줄 & 상위 이동 */}
                <div className="px-4 py-3 border-b border-gray-100 flex gap-2 items-center bg-white shrink-0">
                    <button 
                        onClick={handleUp} 
                        disabled={!currentPath}
                        className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                        title="상위 폴더로"
                    >
                        <VscArrowUp />
                    </button>
                    <input 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 font-mono"
                        value={currentPath || "Computer (Select Drive)"}
                        readOnly
                    />
                </div>

                {/* 폴더 리스트 (바디) */}
                <div className="flex-1 overflow-y-auto p-2 bg-white">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading...</div>
                    ) : !currentPath ? (
                        // 드라이브 목록 렌더링
                        <div className="grid grid-cols-1 gap-1">
                            <div className="px-3 py-2 text-xs font-bold text-gray-400">Drives</div>
                            {roots.map(root => (
                                <div 
                                    key={root}
                                    onClick={() => loadFolders(root)}
                                    className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition border border-transparent hover:border-blue-100 group"
                                >
                                    <VscServer className="text-gray-500 group-hover:text-blue-500" size={18}/>
                                    <span className="font-bold text-gray-700">{root}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // 폴더 목록 렌더링
                        <div className="grid grid-cols-1 gap-1">
                            {items.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">빈 폴더입니다.</div>}
                            {items.map(item => (
                                <div 
                                    key={item.path}
                                    onClick={() => loadFolders(item.path)} // 클릭 시 진입 (더블클릭으로 바꾸고 싶으면 onDoubleClick 사용)
                                    className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded cursor-pointer transition"
                                >
                                    <VscFolder className="text-yellow-500" size={18}/>
                                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 푸터 (선택 버튼) */}
                <div className="h-16 px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                    <div className="text-xs text-gray-400 truncate max-w-[250px]">
                        {currentPath ? `선택된 경로: ${currentPath}` : "드라이브를 선택하세요"}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-white transition">취소</button>
                        <button 
                            disabled={!currentPath}
                            onClick={() => { onSelect(currentPath); onClose(); }} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:bg-gray-300"
                        >
                            이 폴더 선택
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}