// src/pages/ResourceRelocation.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    VscFolder, VscFolderOpened, VscFile, VscWand, VscCheck, VscClose,
    VscChevronRight, VscChevronDown, VscArrowRight, VscChevronLeft,
    VscTrash, VscEdit, VscSearch, VscSparkle, VscLoading
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava, DiMarkdown } from "react-icons/di";

import MenuBar from '../components/MenuBar'; 
import { setVirtualTree, clearVirtualTree, openFile, setWorkspaceId, setWorkspaceTree, setActiveProject, mergeProjectFiles } from '../store/slices/fileSystemSlice';
import { getMyWorkspacesApi, fetchWorkspaceProjectsApi, fetchProjectFilesApi, fetchVirtualViewsApi, generateVirtualViewApi, deleteVirtualViewApi } from '../utils/api'; 

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
    
    const isFile = String(node.type || '').toLowerCase() === 'file' || (!node.children && node.type !== 'directory' && node.type !== 'workspace');

    if (isFile) {
        return (
            <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-200/60 rounded-md text-gray-700 ml-5 transition-colors cursor-pointer"
                 onClick={() => { dispatch(openFile(node)); navigate(getWorkspacePath(workspaceId)); }}>
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

// 💡 백엔드에서 받은 트리 구조를 그대로 렌더링하도록 단순화
const VirtualFolderTree = ({ folder }) => {
    const [isOpen, setIsOpen] = useState(true);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const workspaceId = useSelector(state => state.fileSystem.workspaceId);

    const handleFileClick = (file) => {
        dispatch(openFile(file)); 
        navigate(getWorkspacePath(workspaceId));
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
                    {folder.children?.map(file => (
                        <div key={file.id} onClick={() => handleFileClick(file)}
                             className="flex items-center gap-2.5 py-1.5 px-3 rounded-md cursor-pointer transition-colors hover:bg-blue-50 group">
                            <div className="shrink-0">{getFileIcon(file.name)}</div>
                            <span className="text-[13px] font-medium truncate select-none transition-colors text-gray-700 group-hover:text-blue-700">
                                {file.name}
                            </span>
                            <span className="ml-auto text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[200px]">
                                {file.originalPath === '/' ? 'Root' : file.originalPath}
                            </span>
                        </div>
                    ))}
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

    const [isEditing, setIsEditing] = useState(false);
    
    // 💡 백엔드 및 AI 연동을 위한 상태
    const [savedViews, setSavedViews] = useState([]); // 백엔드에서 불러온 뷰 목록
    const [selectedView, setSelectedView] = useState(null); // 현재 클릭해서 보고 있는 뷰 객체
    const [aiPrompt, setAiPrompt] = useState(''); // 사용자가 입력할 AI 프롬프트
    const [isGenerating, setIsGenerating] = useState(false); // AI 생성 로딩 상태

    // 1. 초기 워크스페이스 목록 로드
    useEffect(() => {
        if (viewMode === 'list') {
            getMyWorkspacesApi()
                .then(list => setWorkspaces(list || []))
                .catch(err => console.error("워크스페이스 로드 실패:", err))
                .finally(() => setIsLoadingWs(false));
        }
    }, [viewMode]);

    // 2. 워크스페이스 진입 시 원본 트리와 "저장된 가상 뷰 목록" 로드
    const handleSelectWorkspace = async (ws) => {
        const targetId = ws.uuid || ws.id || ws.workspaceId;
        setIsLoadingWs(true);
        try {
            const root = await fetchWorkspaceProjectsApi(targetId);
            dispatch(setWorkspaceId(targetId));
            dispatch(setWorkspaceTree(root));
            
            if (root && root.children && root.children.length > 0) {
                const projectName = root.children[0].name;
                dispatch(setActiveProject(projectName));

                try {
                    // 원본 파일 병합
                    const files = await fetchProjectFilesApi(targetId, projectName);
                    dispatch(mergeProjectFiles({ projectName, files }));

                    // 백엔드에서 해당 프로젝트의 저장된 뷰 목록을 불러옵니다.
                    const views = await fetchVirtualViewsApi(targetId, projectName);
                    setSavedViews(views || []);
                } catch (err) {
                    console.error("데이터 구조 로드 실패:", err);
                }
            }

            setIsEditing(false);
            setSelectedView(null);
            setViewMode('detail');
        } catch (e) {
            alert("프로젝트 정보를 불러오지 못했습니다.");
        } finally {
            setIsLoadingWs(false);
        }
    };

    // 3. AI에게 뷰 생성 요청 (새로운 핵심 로직)
    const handleGenerateAiView = async () => {
        if (!aiPrompt.trim() || isGenerating) return;
        setIsGenerating(true);
        try {
            // AI 생성 API 호출
            const newView = await generateVirtualViewApi(workspaceId, activeProject, aiPrompt);
            
            // 성공하면 목록 갱신 및 방금 만든 뷰 자동 선택
            setSavedViews(prev => [...prev, newView]);
            setSelectedView(newView);
            setAiPrompt(''); // 입력창 초기화
        } catch (error) {
            alert("AI가 뷰를 생성하는 중 오류가 발생했습니다: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // 4. 현재 선택된 뷰를 Redux(전역 상태)에 적용하여 IDE에 반영
    const handleApplyView = () => {
        if (!selectedView) return;
        dispatch(setVirtualTree(selectedView.treeData)); // 백엔드에서 준 트리 구조 통째로 저장
        setIsEditing(false); 
    };

    // 5. 뷰 삭제 로직
    const handleDeleteView = async (viewId) => {
        if(!window.confirm("이 뷰를 삭제하시겠습니까?")) return;
        try {
            await deleteVirtualViewApi(workspaceId, activeProject, viewId);
            setSavedViews(prev => prev.filter(v => v.id !== viewId));
            if (selectedView?.id === viewId) setSelectedView(null);
        } catch (error) {
            alert("삭제 실패: " + error.message);
        }
    };

    // 적용된 뷰 원본으로 되돌리기
    const handleReset = () => {
        if(window.confirm("적용된 가상 재배치를 해제하시겠습니까? (원본 파일 구조로 돌아갑니다)")) {
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
                                    
                                    return (
                                        <div key={targetId} onClick={() => handleSelectWorkspace(ws)}
                                            className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all relative group flex flex-col h-[160px]`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <VscFolderOpened className="text-yellow-500 text-3xl drop-shadow-sm" />
                                                    <h3 className="text-lg font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{ws.name}</h3>
                                                </div>
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
                                    <button onClick={() => setViewMode('list')} className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors shadow-sm">
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
                                <button onClick={() => navigate(getWorkspacePath(workspaceId))} className="px-6 py-2.5 bg-[#111827] text-white text-[13px] font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-md shadow-gray-400/20">
                                    IDE 에디터로 돌아가기 <VscArrowRight />
                                </button>
                            </div>
                        </div>

                        {/* 현재 적용된 뷰가 있다면 (IDE 탐색기에 반영된 상태) */}
                        {isVirtualMode && !isEditing ? (
                            <div className="bg-white rounded-3xl shadow-xl border border-blue-200 flex flex-col flex-1 overflow-hidden animate-fade-in ring-4 ring-blue-50">
                                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 flex items-center justify-between z-10">
                                    <div className="flex items-center gap-3 text-blue-700 font-extrabold text-[15px]">
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </span>
                                        현재 가상 뷰 적용 중: {virtualTree.name}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-bold text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors shadow-sm">
                                            <VscEdit size={16} /> 다른 뷰 선택하기
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-bold text-red-600 bg-white hover:bg-red-50 rounded-xl transition-colors border border-red-200 shadow-sm">
                                            <VscTrash size={16} /> 원본 구조로 복구하기
                                        </button>
                                    </div>
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
                        ) : !isEditing && !isVirtualMode ? (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
                                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between z-10">
                                    <div className="flex items-center gap-2 text-gray-700 font-extrabold text-[15px]">
                                        <VscFolderOpened size={20} className="text-yellow-500" />
                                        실제 탐색기 원본 구조 (Original)
                                    </div>
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200">
                                        <VscSparkle size={16} /> AI로 가상 뷰 관리/생성하기
                                    </button>
                                </div>
                                <div className="p-8 flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar">
                                    <div className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-6 shadow-sm bg-white">
                                        <div className="space-y-1">
                                            {tree?.children ? tree.children.map(child => <OriginalTree key={child.id} node={child} />) : <div className="text-xs text-gray-400 p-4">원본 파일이 없습니다.</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 flex flex-col overflow-hidden animate-fade-in flex-1">
                                
                                {/* 💡 AI 프롬프트 영역 */}
                                <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 shrink-0">
                                    <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2 mb-3">
                                        <VscSparkle className="text-blue-600" size={18} /> AI에게 새로운 뷰 생성을 요청해보세요
                                    </h3>
                                    <div className="flex gap-3">
                                        <input 
                                            value={aiPrompt}
                                            onChange={e => setAiPrompt(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleGenerateAiView(); }}
                                            disabled={isGenerating}
                                            placeholder="예: 프론트엔드와 백엔드로 폴더를 분리해줘, 확장자별로 모아줘 등..."
                                            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all disabled:bg-gray-100"
                                        />
                                        <button 
                                            onClick={handleGenerateAiView}
                                            disabled={!aiPrompt.trim() || isGenerating}
                                            className="px-6 bg-[#111827] text-white rounded-xl text-[13px] font-bold hover:bg-black transition-all flex items-center justify-center min-w-[120px] shadow-md disabled:bg-gray-400 disabled:shadow-none"
                                        >
                                            {isGenerating ? <VscLoading className="animate-spin" size={18} /> : "✨ AI로 생성"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-b border-gray-200 flex-1 min-h-[400px]">
                                    
                                    {/* 왼쪽: 저장된 뷰 목록 (Saved Views) */}
                                    <div className="flex-1 bg-[#fafafa] flex flex-col min-w-[280px] max-w-[320px]">
                                        <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0 shadow-sm flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 tracking-wide flex items-center gap-2">
                                                <VscFolderOpened size={16} className="text-blue-500" /> 팀에 저장된 가상 뷰
                                            </span>
                                            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{savedViews.length}</span>
                                        </div>
                                        <div className="py-4 px-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                            {savedViews.length === 0 ? (
                                                <div className="text-xs text-gray-400 p-4 text-center mt-10">
                                                    아직 생성된 뷰가 없습니다.<br/>위 입력창에서 AI에게 요청해보세요!
                                                </div>
                                            ) : (
                                                savedViews.map(view => (
                                                    <div key={view.id} 
                                                         onClick={() => setSelectedView(view)}
                                                         className={`p-3 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${selectedView?.id === view.id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <VscCheck className={selectedView?.id === view.id ? "text-blue-600" : "text-transparent"} size={16} />
                                                            <span className={`text-[13px] font-bold ${selectedView?.id === view.id ? 'text-blue-800' : 'text-gray-700'}`}>{view.name}</span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 truncate pl-6">{view.prompt || "AI 자동 분류"}</p>
                                                        
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteView(view.id); }}
                                                            className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <VscTrash size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* 오른쪽: 선택한 뷰의 프리뷰 */}
                                    <div className="flex-[1.5] bg-white flex flex-col">
                                        <div className="px-6 py-4 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
                                            <span className="text-[13px] font-extrabold text-blue-700 flex items-center gap-2">
                                                ✨ 트리 프리뷰 (Preview)
                                            </span>
                                        </div>
                                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                                            {!selectedView ? (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                                                    <VscSearch size={40} className="text-gray-300" />
                                                    <p className="text-sm font-bold">왼쪽에서 저장된 뷰를 선택하거나 새 뷰를 생성하세요.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedView.treeData?.children?.map(folder => (
                                                        <VirtualFolderTree key={folder.id} folder={folder} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 하단 적용 버튼 영역 */}
                                <div className="bg-white px-6 py-5 flex justify-end gap-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] border-t border-gray-200">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-[13px] rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                                        <VscClose size={18} /> 취소
                                    </button>
                                    <button 
                                        onClick={handleApplyView} 
                                        disabled={!selectedView} 
                                        className="px-8 py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none group"
                                    >
                                        <VscCheck size={18} className="group-disabled:opacity-50" /> 선택한 뷰를 탐색기에 적용하기
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