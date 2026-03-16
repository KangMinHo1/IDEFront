import React, { useState, useEffect } from 'react';
import { VscClose, VscFolder, VscArrowUp, VscDatabase } from "react-icons/vsc"; // 💡 VscDatabase로 변경
import { fetchSystemRootsApi, fetchSubFoldersApi } from '../../utils/api';

export default function PathSelectionModal({ isOpen, onClose, onSelect }) {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState([]);
    const [roots, setRoots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItemPath, setSelectedItemPath] = useState("");

    useEffect(() => {
        if (isOpen) loadRoots();
    }, [isOpen]);

    const loadRoots = async () => {
        setLoading(true);
        try {
            const data = await fetchSystemRootsApi();
            setRoots(data);
            setCurrentPath('');
            setItems([]);
        } catch (e) {
            alert("드라이브 로드 실패: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadFolders = async (path) => {
        setLoading(true);
        setSelectedItemPath("");
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
        if (!currentPath) return;
        if (roots.includes(currentPath) || currentPath.length <= 3) {
            setCurrentPath('');
            setItems([]);
            return;
        }
        const separator = currentPath.includes('/') ? '/' : '\\';
        const lastIndex = currentPath.lastIndexOf(separator);
        const parentPath = currentPath.substring(0, lastIndex) || (currentPath.includes(':') ? currentPath.substring(0, 3) : '');
        loadFolders(parentPath);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-white rounded-[24px] shadow-2xl w-[520px] h-[620px] flex flex-col overflow-hidden border border-gray-100">
                
                {/* 헤더 */}
                <div className="h-16 px-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 shrink-0">
                    <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-[16px]">
                        <VscFolder className="text-yellow-500" size={20}/> 경로 선택
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-black">
                        <VscClose size={24}/>
                    </button>
                </div>

                {/* 현재 경로 표시줄 */}
                <div className="px-5 py-4 border-b border-gray-50 flex gap-3 items-center bg-white shrink-0">
                    <button 
                        onClick={handleUp} 
                        disabled={!currentPath}
                        className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-200 disabled:opacity-20 transition text-gray-600"
                    >
                        <VscArrowUp size={18} />
                    </button>
                    <div className="flex-1 bg-[#f8f9fa] border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-gray-700 font-mono truncate">
                        {currentPath || "Computer (Select Drive)"}
                    </div>
                </div>

                {/* 바디: 리스트 */}
                <div className="flex-1 overflow-y-auto p-4 bg-white custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">Loading...</div>
                    ) : !currentPath ? (
                        <div className="grid grid-cols-1 gap-1">
                            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Drives</div>
                            {roots.map(root => (
                                <div 
                                    key={root}
                                    onClick={() => loadFolders(root)}
                                    className="flex items-center gap-4 p-4 hover:bg-blue-50/50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-blue-100 group"
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        {/* 💡 DiHarddrive 대신 VscDatabase 사용 */}
                                        <VscDatabase size={22}/>
                                    </div>
                                    <span className="font-extrabold text-gray-700 text-[15px]">{root}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Folders</div>
                            {items.length === 0 && <div className="p-10 text-center text-gray-400 text-sm italic">빈 폴더입니다.</div>}
                            {items.map(item => (
                                <div 
                                    key={item.path}
                                    onClick={() => setSelectedItemPath(item.path)}
                                    onDoubleClick={() => loadFolders(item.path)}
                                    className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                                        selectedItemPath === item.path 
                                        ? 'bg-blue-50 border-blue-200' 
                                        : 'hover:bg-gray-50 border-transparent'
                                    }`}
                                >
                                    <VscFolder className={selectedItemPath === item.path ? "text-blue-500" : "text-yellow-500"} size={22}/>
                                    <span className={`text-[14px] font-semibold truncate ${selectedItemPath === item.path ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="h-20 px-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between shrink-0">
                    <div className="text-[12px] text-gray-400 font-medium truncate max-w-[220px]">
                        {selectedItemPath || currentPath ? `선택됨: ${selectedItemPath || currentPath}` : "위치를 선택하세요"}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 font-bold text-[13px] hover:border-gray-300 transition shadow-sm">취소</button>
                        <button 
                            disabled={!currentPath && !selectedItemPath}
                            onClick={() => { onSelect(selectedItemPath || currentPath); onClose(); }} 
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:bg-gray-200"
                        >
                            이 폴더 선택
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}