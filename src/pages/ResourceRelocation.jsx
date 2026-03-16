// src/pages/ResourceRelocation.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    VscFolder, VscFolderOpened, VscFile, VscWand, VscCheck, VscClose,
    VscChevronRight, VscChevronDown, VscArrowRight, 
    VscFileCode, VscSettingsGear, VscHistory, VscTrash, VscEdit
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava, DiMarkdown } from "react-icons/di";

import MenuBar from '../components/MenuBar'; 
import { setVirtualTree, clearVirtualTree, openFile } from '../store/slices/fileSystemSlice';

const getFileIcon = (name) => {
    if (!name) return <VscFile className="text-gray-400" size={16} />;
    const ext = name.split('.').pop().toLowerCase();
    switch(ext) {
        case 'java': return <DiJava className="text-orange-500" size={16} />;
        case 'py': return <DiPython className="text-blue-500" size={16} />;
        case 'js': return <DiJsBadge className="text-yellow-400" size={16} />;
        case 'jsx': return <DiReact className="text-blue-400" size={16} />;
        case 'md': return <DiMarkdown className="text-gray-500" size={16} />;
        default: return <VscFile className="text-gray-400" size={16} />;
    }
};

// 💡 [수정] 워크스페이스가 팀용인지 개인용인지 판별하여 정확한 URL을 반환하는 헬퍼 함수
const getWorkspacePath = (id) => {
    if (!id) return '/';
    const teamList = JSON.parse(localStorage.getItem('teamWorkspaces') || '[]');
    const isTeam = teamList.includes(id);
    return `/workspace/${isTeam ? 'team' : 'personal'}/${id}`;
};

const OriginalTree = ({ node }) => {
    const [isOpen, setIsOpen] = useState(true);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const workspaceId = useSelector(state => state.fileSystem.workspaceId);

    if (!node) return null;
    
    if (node.type === 'file' || !node.children) {
        return (
            <div 
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-200/60 rounded-md text-gray-700 ml-5 transition-colors cursor-pointer"
                onClick={() => {
                    dispatch(openFile(node));
                    navigate(getWorkspacePath(workspaceId)); // 💡 [수정] 올바른 경로로 라우팅
                }}
            >
                {getFileIcon(node.name)}
                <span className="text-[13px] font-medium truncate hover:text-blue-600 transition-colors">{node.name}</span>
            </div>
        );
    }

    return (
        <div className="ml-1 mb-0.5">
            <div className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-gray-200/60 rounded-md cursor-pointer transition-colors group" onClick={() => setIsOpen(!isOpen)}>
                <span className="text-gray-400 group-hover:text-blue-500">{isOpen ? <VscChevronDown size={16}/> : <VscChevronRight size={16}/>}</span>
                <span className="text-gray-500 group-hover:text-blue-500">{isOpen ? <VscFolderOpened size={18}/> : <VscFolder size={18}/>}</span>
                <span className="text-[13.5px] font-bold text-gray-800 select-none group-hover:text-blue-700">{node.name}</span>
            </div>
            {isOpen && (
                <div className="border-l border-gray-200 ml-4 pl-1 mt-0.5 space-y-0.5">
                    {node.children.map((child, idx) => <OriginalTree key={child.id || idx} node={child} />)}
                </div>
            )}
        </div>
    );
};

const VirtualFolderTree = ({ folder, checkable = false, selectedFiles = [], toggleSelection = () => {} }) => {
    const [isOpen, setIsOpen] = useState(true);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const workspaceId = useSelector(state => state.fileSystem.workspaceId);

    const handleFileClick = (file) => {
        if (checkable) {
            toggleSelection(file.id); 
        } else {
            dispatch(openFile(file)); 
            navigate(getWorkspacePath(workspaceId)); // 💡 [수정] 올바른 경로로 라우팅
        }
    };

    return (
        <div className="ml-1 mb-3">
            <div className="flex items-center gap-1.5 py-2 px-2 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors group" onClick={() => setIsOpen(!isOpen)}>
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{isOpen ? <VscChevronDown size={18}/> : <VscChevronRight size={18}/>}</span>
                <span className="text-blue-500">{isOpen ? <VscFolderOpened size={20} /> : <VscFolder size={20} />}</span>
                <span className="font-bold text-gray-800 text-[14px] select-none ml-1">{folder.name}</span>
                <span className="ml-2 text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    {folder.children?.length || 0}
                </span>
            </div>
            {isOpen && (
                <div className="border-l border-blue-100 ml-4 pl-3 mt-1 space-y-0.5">
                    {folder.children?.map(file => {
                        const isChecked = checkable ? selectedFiles.includes(file.id) : true;
                        return (
                            <div key={file.id} onClick={() => handleFileClick(file)}
                                className={`flex items-center gap-2.5 py-1.5 px-3 rounded-md cursor-pointer transition-colors group
                                    ${checkable ? (isChecked ? 'hover:bg-blue-50' : 'opacity-40 hover:opacity-80') : 'hover:bg-blue-50'}
                                `}>
                                {checkable && (
                                    <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'}`}>
                                        {isChecked && <VscCheck size={10} strokeWidth={2} />}
                                    </div>
                                )}
                                <div className="shrink-0">{getFileIcon(file.name)}</div>
                                <span className={`text-[13px] font-medium truncate select-none transition-colors ${checkable && !isChecked ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-blue-700'}`}>
                                    {file.name}
                                </span>
                                <span className="ml-auto text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[200px]">
                                    {file.originalPath === '/' ? 'Root' : file.originalPath}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


export default function ResourceRelocation() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { tree, activeProject, workspaceId, virtualTree } = useSelector(state => state.fileSystem);
    const isVirtualMode = virtualTree !== null && virtualTree !== undefined;

    const [isEditing, setIsEditing] = useState(false);
    const [filterMode, setFilterMode] = useState('language'); 
    const [expandedFolders, setExpandedFolders] = useState([]); 
    const [selectedFiles, setSelectedFiles] = useState([]);

    const flatFiles = useMemo(() => {
        const extractFiles = (nodesArr, parentPath = '') => {
            let result = [];
            if (!nodesArr) return result;
            const target = Array.isArray(nodesArr) ? nodesArr : [nodesArr];
            
            target.forEach(n => {
                if (!n) return;
                const safeName = n.name || 'unnamed'; 

                if (String(n.type || '').toLowerCase() === 'file') {
                    const mockDate = safeName.length % 3 === 0 ? 'today' : (safeName.length % 2 === 0 ? 'week' : 'older');
                    result.push({ ...n, name: safeName, originalPath: parentPath || '/', mockDate });
                } else if (n.children) {
                    const nextPath = parentPath ? `${parentPath}/${safeName}` : safeName;
                    result = result.concat(extractFiles(n.children, nextPath));
                }
            });
            return result;
        };
        return extractFiles(tree);
    }, [tree]);

    const previewStructure = useMemo(() => {
        const groups = {};

        if (filterMode === 'language') {
            groups["Java (Spring Boot)"] = [];
            groups["JavaScript & React"] = [];
            groups["Python"] = [];
            groups["Documents & Configs"] = [];
            groups["Others"] = [];

            flatFiles.forEach(file => {
                const safeName = file.name || '';
                const ext = safeName.includes('.') ? safeName.split('.').pop().toLowerCase() : '';
                if (ext === 'java') groups["Java (Spring Boot)"].push(file);
                else if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) groups["JavaScript & React"].push(file);
                else if (ext === 'py') groups["Python"].push(file);
                else if (['md', 'txt', 'json', 'xml', 'yml', 'yaml'].includes(ext)) groups["Documents & Configs"].push(file);
                else groups["Others"].push(file);
            });
        } else if (filterMode === 'content') {
            groups["💻 UI 컴포넌트"] = [];
            groups["📦 상태 관리 (Store/Redux)"] = [];
            groups["⚙️ 유틸리티 & API"] = [];
            groups["📄 코어 및 기타 파일"] = [];

            flatFiles.forEach(file => {
                const name = (file.name || '').toLowerCase();
                if (name.includes('modal') || name.includes('panel') || name.includes('bar') || name.includes('dashboard') || name.includes('tab')) groups["💻 UI 컴포넌트"].push(file);
                else if (name.includes('slice') || name.includes('store')) groups["📦 상태 관리 (Store/Redux)"].push(file);
                else if (name.includes('api') || name.includes('socket') || name.includes('util') || name.includes('helper')) groups["⚙️ 유틸리티 & API"].push(file);
                else groups["📄 코어 및 기타 파일"].push(file);
            });
        } else if (filterMode === 'date') {
            groups["🔥 오늘 작업한 파일"] = [];
            groups["📅 이번 주 작업한 파일"] = [];
            groups["🗄️ 오래된 파일 (보관)"] = [];

            flatFiles.forEach(file => {
                if (file.mockDate === 'today') groups["🔥 오늘 작업한 파일"].push(file);
                else if (file.mockDate === 'week') groups["📅 이번 주 작업한 파일"].push(file);
                else groups["🗄️ 오래된 파일 (보관)"].push(file);
            });
        }

        return Object.entries(groups)
            .filter(([_, files]) => files.length > 0)
            .map(([folderName, files]) => ({
                id: folderName,
                name: folderName,
                children: files
            }));
    }, [flatFiles, filterMode]);

    useEffect(() => {
        setExpandedFolders(previewStructure.map(g => g.id));
        setSelectedFiles(flatFiles.map(f => f.id));
    }, [previewStructure, flatFiles]);

    const toggleFileSelection = (fileId) => {
        setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };

    const finalStructure = useMemo(() => {
        return previewStructure.map(folder => ({
            ...folder,
            children: folder.children.filter(f => selectedFiles.includes(f.id))
        })).filter(folder => folder.children.length > 0);
    }, [previewStructure, selectedFiles]);

    const handleApply = () => {
        const virtualTreePayload = {
            id: 'virtual-root',
            name: activeProject || "Virtual Project",
            type: 'directory',
            isVirtualRoot: true,
            children: finalStructure.map((folder, idx) => ({
                id: `virtual-folder-${idx}`,
                name: folder.name,
                type: 'directory',
                isVirtual: true,
                children: folder.children 
            }))
        };
        dispatch(setVirtualTree(virtualTreePayload));
        setIsEditing(false); 
    };

    const handleReset = () => {
        if(window.confirm("적용된 가상 재배치를 해제하시겠습니까? (원본 구조로 돌아갑니다)")) {
            dispatch(clearVirtualTree());
            setIsEditing(false); 
        }
    };

    return (
        <div className="w-screen h-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden relative">
            <MenuBar />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1200px] w-full mx-auto py-8 px-6 flex flex-col h-full">
                    
                    <div className="mb-6 flex flex-col gap-2 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><VscWand size={24} /></div>
                                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    가상 폴더 탐색기
                                    {activeProject && (
                                        <span className="text-[13px] font-bold bg-gray-800 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                            <VscFolderOpened /> {activeProject}
                                        </span>
                                    )}
                                </h1>
                            </div>
                            
                            <button 
                                onClick={() => navigate(getWorkspacePath(workspaceId))} 
                                className="px-5 py-2 bg-[#111827] text-white text-[13px] font-bold rounded-lg hover:bg-black transition-colors flex items-center gap-2 shadow-md"
                            >
                                IDE 에디터 뷰로 돌아가기
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mt-1">
                            {isVirtualMode 
                                ? "현재 워크스페이스에 적용된 가상 폴더 구조입니다. 파일을 클릭하면 에디터에 바로 열립니다." 
                                : "파일의 실제 경로는 변경되지 않습니다. 원하는 기준에 따라 파일을 가상으로 묶어서 보여줍니다."}
                        </p>
                    </div>

                    {isVirtualMode ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
                            <div className="px-6 py-4 bg-[#f8fafc] border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-2 text-blue-600 font-bold">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                    가상 재배치 적용 중
                                </div>
                                <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-red-600 bg-white hover:bg-red-50 rounded-lg transition-colors border border-red-200 shadow-sm">
                                    <VscTrash size={14} /> 가상 재배치 해제하기
                                </button>
                            </div>
                            
                            <div className="p-8 flex-1 overflow-y-auto bg-white">
                                <div className="max-w-2xl mx-auto border border-gray-100 rounded-xl p-6 shadow-sm bg-[#fafafa]">
                                    <div className="space-y-1">
                                        {virtualTree?.children?.map(folder => (
                                            <VirtualFolderTree key={folder.id} folder={folder} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : flatFiles.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 font-bold mt-10">
                            프로젝트에 분석할 파일이 없습니다. 에디터에서 파일을 먼저 생성해주세요.
                        </div>
                    ) : !isEditing ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-2 text-gray-600 font-bold">
                                    <VscFolderOpened size={18} />
                                    실제 탐색기 원본 구조
                                </div>
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 shadow-sm"
                                >
                                    <VscEdit size={14} /> 가상 재배치 시작하기
                                </button>
                            </div>
                            
                            <div className="p-8 flex-1 overflow-y-auto bg-white">
                                <div className="max-w-2xl mx-auto border border-gray-100 rounded-xl p-6 shadow-sm bg-[#fafafa]">
                                    <div className="space-y-1">
                                        {tree?.children ? (
                                            tree.children.map(child => <OriginalTree key={child.id} node={child} />)
                                        ) : (
                                            <div className="text-xs text-gray-400 p-4">원본 파일이 없습니다.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-fade-in flex-1">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
                                <span className="text-[13px] font-extrabold text-gray-700">재배치 프리뷰 필터 설정</span>
                                <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner gap-1">
                                    <button onClick={() => setFilterMode('language')} className={`flex items-center gap-2 px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${filterMode === 'language' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><VscFileCode size={16} /> 확장자/언어별</button>
                                    <button onClick={() => setFilterMode('content')} className={`flex items-center gap-2 px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${filterMode === 'content' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><VscSettingsGear size={16} /> 파일 기능/내용별</button>
                                    <button onClick={() => setFilterMode('date')} className={`flex items-center gap-2 px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all ${filterMode === 'date' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><VscHistory size={16} /> 최근 작업일별</button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-b border-gray-200 flex-1 min-h-[450px]">
                                <div className="flex-1 bg-[#fafafa] flex flex-col min-w-[280px] max-w-[320px]">
                                    <div className="px-6 py-3 bg-gray-100/50 border-b border-gray-200 shrink-0">
                                        <span className="text-xs font-bold text-gray-500 tracking-wide flex items-center gap-2">
                                            <VscFolderOpened size={16} /> 실제 탐색기 원본 구조
                                        </span>
                                    </div>
                                    <div className="py-4 pr-4 flex-1 overflow-y-auto custom-scrollbar">
                                        {tree?.children ? (
                                            tree.children.map(child => <OriginalTree key={child.id} node={child} />)
                                        ) : (
                                            <div className="text-xs text-gray-400 p-4">원본 파일이 없습니다.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-center justify-center bg-white w-12 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] shrink-0">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><VscArrowRight size={18} /></div>
                                </div>

                                <div className="flex-[1.5] bg-white flex flex-col">
                                    <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center transition-colors shrink-0">
                                        <span className="text-xs font-extrabold text-blue-700 tracking-wide flex items-center gap-2">✨ 가상 프리뷰 (체크 해제 가능)</span>
                                        <span className="text-[11px] font-bold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">포함됨: {selectedFiles.length} / {flatFiles.length}</span>
                                    </div>
                                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-2">
                                            {previewStructure.map(folder => (
                                                <VirtualFolderTree 
                                                    key={folder.id} 
                                                    folder={folder} 
                                                    checkable={true} 
                                                    selectedFiles={selectedFiles} 
                                                    toggleSelection={toggleFileSelection} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-5 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                                <button 
                                    onClick={() => setIsEditing(false)} 
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                                >
                                    <VscClose size={18} /> 설정 취소
                                </button>
                                <button onClick={handleApply} disabled={selectedFiles.length === 0} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:bg-gray-400 disabled:shadow-none animate-pulse">
                                    <VscWand size={18} /> 이 구조로 가상 탐색기에 적용
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}