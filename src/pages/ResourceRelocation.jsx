// src/pages/ResourceRelocation.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    VscFolder, VscFolderOpened, VscFile, VscWand, VscCheck, VscClose,
    VscChevronRight, VscChevronDown, VscArrowRight, VscChevronLeft,
    VscFileCode, VscSettingsGear, VscHistory, VscTrash, VscEdit,
    VscSearch, VscCheckAll, VscClearAll, VscServer, VscPaintcan, VscSourceControl,
    VscSymbolClass 
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava, DiMarkdown } from "react-icons/di";

import MenuBar from '../components/MenuBar'; 
import { setVirtualTree, clearVirtualTree, openFile, setWorkspaceId, setWorkspaceTree, setActiveProject, mergeProjectFiles } from '../store/slices/fileSystemSlice';
import { getMyWorkspacesApi, fetchWorkspaceProjectsApi, fetchProjectFilesApi } from '../utils/api';

const getFileIcon = (name) => {
    if (!name) return <VscFile className="text-gray-400" size={16} />;
    const ext = name.split('.').pop().toLowerCase();
    switch(ext) {
        case 'java': return <DiJava className="text-orange-500" size={16} />;
        case 'py': return <DiPython className="text-blue-500" size={16} />;
        case 'js': return <DiJsBadge className="text-yellow-400" size={16} />;
        case 'jsx': case 'tsx': return <DiReact className="text-blue-400" size={16} />;
        case 'md': return <DiMarkdown className="text-gray-500" size={16} />;
        default: return <VscFile className="text-gray-400" size={16} />;
    }
};

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
    
    // 유연한 파일 검증
    const isFile = String(node.type || '').toLowerCase() === 'file' || (!node.children && node.type !== 'directory' && node.type !== 'workspace');

    if (isFile) {
        return (
            <div 
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-200/60 rounded-md text-gray-700 ml-5 transition-colors cursor-pointer"
                onClick={() => {
                    dispatch(openFile(node));
                    navigate(getWorkspacePath(workspaceId));
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
            {isOpen && node.children && (
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
            navigate(getWorkspacePath(workspaceId));
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

    const [viewMode, setViewMode] = useState('list'); 
    const [workspaces, setWorkspaces] = useState([]);
    const [isLoadingWs, setIsLoadingWs] = useState(true);
    const [savedVirtualTrees, setSavedVirtualTrees] = useState({});

    const [isEditing, setIsEditing] = useState(false);
    const [filterMode, setFilterMode] = useState('architecture'); 
    const [searchQuery, setSearchQuery] = useState(''); 
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        if (viewMode === 'list') {
            const trees = JSON.parse(localStorage.getItem('virtualTrees') || '{}');
            setSavedVirtualTrees(trees);

            getMyWorkspacesApi()
                .then(list => setWorkspaces(list || []))
                .catch(err => console.error("워크스페이스 로드 실패:", err))
                .finally(() => setIsLoadingWs(false));
        }
    }, [viewMode]);

    const handleSelectWorkspace = async (ws) => {
        const targetId = ws.uuid || ws.id || ws.workspaceId;
        setIsLoadingWs(true);
        try {
            // 1. 프로젝트 트리 호출
            const root = await fetchWorkspaceProjectsApi(targetId);
            dispatch(setWorkspaceId(targetId));
            dispatch(setWorkspaceTree(root));
            
            // 2. 파일 목록 병합 (핵심)
            if (root && root.children && root.children.length > 0) {
                const projectName = root.children[0].name;
                dispatch(setActiveProject(projectName));

                try {
                    const files = await fetchProjectFilesApi(targetId, projectName);
                    dispatch(mergeProjectFiles({ projectName, files }));
                } catch (err) {
                    console.error("파일 구조 로드 실패:", err);
                }
            }

            const trees = JSON.parse(localStorage.getItem('virtualTrees') || '{}');
            if (trees[targetId]) dispatch(setVirtualTree(trees[targetId]));
            else dispatch(clearVirtualTree());

            setIsEditing(false);
            setViewMode('detail');
        } catch (e) {
            alert("프로젝트 정보를 불러오지 못했습니다.");
        } finally {
            setIsLoadingWs(false);
        }
    };

    const flatFiles = useMemo(() => {
        const extractFiles = (nodesArr, parentPath = '') => {
            let result = [];
            if (!nodesArr) return result;
            const target = Array.isArray(nodesArr) ? nodesArr : [nodesArr];
            
            target.forEach(n => {
                if (!n) return;
                const safeName = n.name || 'unnamed'; 

                const isFile = String(n.type || '').toLowerCase() === 'file' || 
                               (!n.children && n.type !== 'directory' && n.type !== 'workspace');

                if (isFile) {
                    const mockDate = safeName.length % 3 === 0 ? 'today' : (safeName.length % 2 === 0 ? 'week' : 'older');
                    const mockSize = (safeName.length * 12) + (Math.random() * 50); 
                    
                    const safeId = n.id || `${parentPath}/${safeName}`; 
                    
                    result.push({ ...n, id: safeId, name: safeName, originalPath: parentPath || '/', mockDate, mockSize });
                } else if (n.children) {
                    const nextPath = parentPath ? `${parentPath}/${safeName}` : safeName;
                    result = result.concat(extractFiles(n.children, nextPath));
                }
            });
            return result;
        };
        return extractFiles(tree);
    }, [tree]);

    const searchedFiles = useMemo(() => {
        if (!searchQuery.trim()) return flatFiles;
        return flatFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.originalPath.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [flatFiles, searchQuery]);

    // 💡 새롭게 강화된 필터링 로직
    const previewStructure = useMemo(() => {
        const groups = {};

        if (filterMode === 'architecture') {
            groups["🌐 UI/UX (화면 & 컴포넌트)"] = [];
            groups["🧠 Client Logic (상태 & 유틸)"] = [];
            groups["⚙️ Server API (컨트롤러 & 라우터)"] = [];
            groups["🗄️ Database (모델 & 레포지토리)"] = [];
            groups["🐳 Infra & Config (인프라 & 설정)"] = [];
            groups["📄 Docs & Assets (문서 & 정적자원)"] = [];
            groups["📦 기타 미분류 파일"] = [];

            searchedFiles.forEach(file => {
                const name = (file.name || '').toLowerCase();
                const path = (file.originalPath || '').toLowerCase();
                const ext = name.includes('.') ? name.split('.').pop() : '';

                if (['jsx', 'tsx', 'vue', 'svelte'].includes(ext) || path.includes('/components') || path.includes('/pages') || path.includes('/views') || path.includes('/layout')) {
                    groups["🌐 UI/UX (화면 & 컴포넌트)"].push(file);
                } else if (path.includes('/store') || path.includes('/hooks') || path.includes('/utils') || path.includes('/context') || path.includes('/api')) {
                    groups["🧠 Client Logic (상태 & 유틸)"].push(file);
                } else if (name.includes('controller') || name.includes('service') || name.includes('route') || name.includes('handler')) {
                    groups["⚙️ Server API (컨트롤러 & 라우터)"].push(file);
                } else if (name.includes('entity') || name.includes('repository') || name.includes('dto') || name.includes('model') || name.includes('schema') || ext === 'sql') {
                    groups["🗄️ Database (모델 & 레포지토리)"].push(file);
                } else if (['json', 'yml', 'yaml', 'xml', 'env', 'ini', 'properties'].includes(ext) || name.includes('config') || name.includes('docker') || name.includes('build') || name.includes('package') || name.includes('webpack')) {
                    groups["🐳 Infra & Config (인프라 & 설정)"].push(file);
                } else if (['md', 'txt', 'png', 'svg', 'jpg', 'ico'].includes(ext) || path.includes('/public') || path.includes('/assets')) {
                    groups["📄 Docs & Assets (문서 & 정적자원)"].push(file);
                } else {
                    groups["📦 기타 미분류 파일"].push(file);
                }
            });
        } else if (filterMode === 'type') {
            groups["💻 소스 코드 (Source)"] = [];
            groups["🎨 스타일 & 정적 에셋 (Style/Asset)"] = [];
            groups["🛠️ 환경 설정 파일 (Config)"] = [];
            groups["📝 문서 (Docs)"] = [];
            groups["📦 기타"] = [];

            searchedFiles.forEach(file => {
                const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
                if (['java', 'kt', 'py', 'js', 'jsx', 'ts', 'tsx', 'c', 'cpp', 'go', 'rs', 'php'].includes(ext)) groups["💻 소스 코드 (Source)"].push(file);
                else if (['css', 'scss', 'html', 'svg', 'png', 'jpg', 'ico', 'woff', 'ttf'].includes(ext)) groups["🎨 스타일 & 정적 에셋 (Style/Asset)"].push(file);
                else if (['json', 'yml', 'yaml', 'xml', 'properties', 'env', 'gradle', 'toml'].includes(ext)) groups["🛠️ 환경 설정 파일 (Config)"].push(file);
                else if (['md', 'txt', 'csv'].includes(ext)) groups["📝 문서 (Docs)"].push(file);
                else groups["📦 기타"].push(file);
            });
        } else if (filterMode === 'module') {
            searchedFiles.forEach(file => {
                const pathParts = file.originalPath.split('/').filter(p => p.trim() !== '');
                const rootModule = pathParts.length > 0 ? `📁 ${pathParts[0].toUpperCase()} (모듈)` : "📁 최상위 루트 파일";
                
                if (!groups[rootModule]) groups[rootModule] = [];
                groups[rootModule].push(file);
            });
        } else if (filterMode === 'atomic') {
            groups["🧱 Atoms (기본 UI 요소)"] = [];
            groups["🧬 Molecules (조합 컴포넌트)"] = [];
            groups["🦠 Organisms (독립 모듈)"] = [];
            groups["📄 Pages (화면 단위)"] = [];
            groups["📦 기타 일반 파일"] = [];

            searchedFiles.forEach(file => {
                const path = (file.originalPath || '').toLowerCase();
                const name = (file.name || '').toLowerCase();
                
                if (path.includes('/atom') || name.includes('button') || name.includes('input') || name.includes('icon') || name.includes('badge')) groups["🧱 Atoms (기본 UI 요소)"].push(file);
                else if (path.includes('/molecule') || name.includes('card') || name.includes('form') || name.includes('listitem')) groups["🧬 Molecules (조합 컴포넌트)"].push(file);
                else if (path.includes('/organism') || name.includes('header') || name.includes('footer') || name.includes('sidebar') || name.includes('navbar')) groups["🦠 Organisms (독립 모듈)"].push(file);
                else if (path.includes('/page') || path.includes('/view') || name.includes('screen') || name.includes('main')) groups["📄 Pages (화면 단위)"].push(file);
                else groups["📦 기타 일반 파일"].push(file);
            });
        }

        return Object.entries(groups)
            .filter(([_, files]) => files.length > 0)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) 
            .map(([folderName, files]) => ({
                id: folderName,
                name: folderName,
                children: files
            }));
    }, [searchedFiles, filterMode]);

    useEffect(() => {
        if (viewMode === 'detail' && isEditing) {
            setSelectedFiles(searchedFiles.map(f => f.id));
        }
    }, [searchedFiles, viewMode, isEditing]);

    const toggleFileSelection = (fileId) => {
        setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };

    const handleSelectAll = () => setSelectedFiles(searchedFiles.map(f => f.id));
    const handleDeselectAll = () => setSelectedFiles([]);

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
        
        const updatedTrees = { ...savedVirtualTrees, [workspaceId]: virtualTreePayload };
        localStorage.setItem('virtualTrees', JSON.stringify(updatedTrees));
        setSavedVirtualTrees(updatedTrees);

        dispatch(setVirtualTree(virtualTreePayload));
        setIsEditing(false); 
    };

    const handleReset = () => {
        if(window.confirm("적용된 가상 재배치를 해제하시겠습니까? (원본 파일 구조로 돌아갑니다)")) {
            const updatedTrees = { ...savedVirtualTrees };
            delete updatedTrees[workspaceId];
            localStorage.setItem('virtualTrees', JSON.stringify(updatedTrees));
            setSavedVirtualTrees(updatedTrees);

            dispatch(clearVirtualTree());
            setIsEditing(false); 
        }
    };

    return (
        <div className="w-screen h-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden relative">
            <MenuBar />

            <div className="flex-1 overflow-y-auto">
                {viewMode === 'list' ? (
                    <div className="max-w-[1200px] w-full mx-auto py-12 px-6 flex flex-col h-full animate-fade-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><VscWand size={28} /></div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">자료 재배치 워크스페이스 선택</h1>
                                <p className="text-gray-500 font-medium mt-1">가상 폴더 구조를 적용하거나 해제할 워크스페이스를 선택하세요.</p>
                            </div>
                        </div>

                        {isLoadingWs ? (
                            <div className="flex justify-center items-center py-20 text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : workspaces.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 font-bold">
                                생성된 워크스페이스가 없습니다. 대시보드에서 먼저 생성해주세요.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {workspaces.map((ws) => {
                                    const targetId = ws.uuid || ws.id || ws.workspaceId;
                                    const isTeam = ws.type === 'team' || JSON.parse(localStorage.getItem('teamWorkspaces') || '[]').includes(targetId);
                                    const isRelocated = !!savedVirtualTrees[targetId];

                                    return (
                                        <div 
                                            key={targetId}
                                            onClick={() => handleSelectWorkspace(ws)}
                                            className={`bg-white rounded-2xl p-6 border ${isRelocated ? 'border-blue-400 shadow-md ring-2 ring-blue-50' : 'border-gray-200 shadow-sm'} hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all relative group flex flex-col h-[160px]`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <VscFolderOpened className={`${isRelocated ? 'text-blue-500' : 'text-yellow-500'} text-3xl drop-shadow-sm`} />
                                                    <h3 className="text-lg font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{ws.name}</h3>
                                                </div>
                                                {isRelocated && (
                                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 font-bold px-2 py-1 rounded-md text-[11px] animate-pulse">
                                                        ✨ 재배치됨
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono mb-auto">ID: {targetId.substring(0, 13)}...</p>
                                            <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                                                <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${isTeam ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {isTeam ? 'TEAM' : 'SOLO'}
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                                                    설정 편집 <VscArrowRight />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-[1300px] w-full mx-auto py-8 px-6 flex flex-col h-full animate-fade-in">
                        <div className="mb-6 flex flex-col gap-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors shadow-sm"
                                    >
                                        <VscChevronLeft size={24} />
                                    </button>
                                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><VscWand size={24} /></div>
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
                                    className="px-6 py-2.5 bg-[#111827] text-white text-[13px] font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-md shadow-gray-400/20"
                                >
                                    IDE 에디터로 돌아가기 <VscArrowRight />
                                </button>
                            </div>
                        </div>

                        {isVirtualMode ? (
                            <div className="bg-white rounded-3xl shadow-xl border border-blue-200 flex flex-col flex-1 overflow-hidden animate-fade-in ring-4 ring-blue-50">
                                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 flex items-center justify-between z-10">
                                    <div className="flex items-center gap-3 text-blue-700 font-extrabold text-[15px]">
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </span>
                                        가상 재배치 적용 중 (Active)
                                    </div>
                                    <button onClick={handleReset} className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-bold text-red-600 bg-white hover:bg-red-50 rounded-xl transition-colors border border-red-200 shadow-sm">
                                        <VscTrash size={16} /> 원본 구조로 복구하기
                                    </button>
                                </div>
                                
                                <div className="p-8 flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar">
                                    <div className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-6 shadow-sm bg-white">
                                        <div className="space-y-1">
                                            {virtualTree?.children?.map(folder => (
                                                <VirtualFolderTree key={folder.id} folder={folder} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : flatFiles.length === 0 ? (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-20 text-gray-400 flex-1">
                                <VscFolder size={64} className="text-gray-200 mb-4" />
                                <span className="font-bold text-lg text-gray-500">프로젝트에 분석할 파일이 없습니다</span>
                                <span className="text-sm mt-2">에디터에서 파일을 먼저 생성해주세요.</span>
                            </div>
                        ) : !isEditing ? (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
                                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between z-10">
                                    <div className="flex items-center gap-2 text-gray-700 font-extrabold text-[15px]">
                                        <VscFolderOpened size={20} className="text-yellow-500" />
                                        실제 탐색기 원본 구조 (Original)
                                    </div>
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200"
                                    >
                                        <VscEdit size={16} /> 가상 재배치 시작하기
                                    </button>
                                </div>
                                
                                <div className="p-8 flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar">
                                    <div className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-6 shadow-sm bg-white">
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
                            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 flex flex-col overflow-hidden animate-fade-in flex-1">
                                {/* 💡 개편된 4가지 필터 버튼 영역 */}
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-4 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2">
                                            <VscSettingsGear size={18} className="text-blue-600" /> 재배치 프리뷰 설정
                                        </span>
                                        
                                        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-1.5 w-64 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                                            <VscSearch className="text-gray-400" />
                                            <input 
                                                className="w-full bg-transparent border-none outline-none text-[12px] px-2 text-gray-700 placeholder-gray-400" 
                                                placeholder="파일명 또는 경로 검색..." 
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setFilterMode('architecture')} className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl border transition-all ${filterMode === 'architecture' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}><VscServer size={16} /> 풀스택 아키텍처별</button>
                                        <button onClick={() => setFilterMode('type')} className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl border transition-all ${filterMode === 'type' ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}><VscFileCode size={16} /> 파일 유형별 (역할)</button>
                                        <button onClick={() => setFilterMode('module')} className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl border transition-all ${filterMode === 'module' ? 'bg-green-50 border-green-300 text-green-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}><VscFolder size={16} /> 최상위 모듈별 (Domain)</button>
                                        <button onClick={() => setFilterMode('atomic')} className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl border transition-all ${filterMode === 'atomic' ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}><VscSymbolClass size={16} /> Atomic 디자인별</button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-b border-gray-200 flex-1 min-h-[400px]">
                                    <div className="flex-1 bg-[#fafafa] flex flex-col min-w-[280px] max-w-[320px]">
                                        <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0 shadow-sm">
                                            <span className="text-xs font-bold text-gray-500 tracking-wide flex items-center gap-2">
                                                <VscFolderOpened size={16} className="text-yellow-500" /> 실제 탐색기 원본
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
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><VscArrowRight size={18} /></div>
                                    </div>

                                    <div className="flex-[1.5] bg-white flex flex-col">
                                        <div className="px-6 py-3 bg-white border-b border-gray-200 flex justify-between items-center shrink-0 shadow-sm z-10">
                                            <span className="text-[13px] font-extrabold text-blue-700 flex items-center gap-2">
                                                ✨ 가상 프리뷰 결과
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md ml-2">포함됨: {selectedFiles.length} / {searchedFiles.length}</span>
                                            </span>
                                            <div className="flex gap-2">
                                                <button onClick={handleSelectAll} className="flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"><VscCheckAll size={14}/> 전체 선택</button>
                                                <button onClick={handleDeselectAll} className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"><VscClearAll size={14}/> 전체 해제</button>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                                            {previewStructure.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                                                    <VscSearch size={40} className="text-gray-300" />
                                                    <p className="text-sm font-bold">검색 결과 또는 필터에 맞는 파일이 없습니다.</p>
                                                </div>
                                            ) : (
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
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white px-6 py-5 flex justify-end gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-[13px] rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <VscClose size={18} /> 편집 취소
                                    </button>
                                    <button onClick={handleApply} disabled={selectedFiles.length === 0} className="px-8 py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none group">
                                        <VscWand size={18} className="group-disabled:opacity-50" /> 현재 구조로 가상 탐색기 생성
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}