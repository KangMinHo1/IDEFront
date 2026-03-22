// src/pages/ResourceRelocation.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    VscFolder, VscFolderOpened, VscFile, VscWand, VscCheck,
    VscChevronRight, VscChevronDown, VscArrowRight, VscChevronLeft,
    VscTrash, VscSearch, VscSparkle, VscLoading
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava, DiMarkdown } from "react-icons/di";

import MenuBar from '../components/MenuBar'; 
import { setVirtualTree, clearVirtualTree, openFile, setWorkspaceId, setWorkspaceTree, setActiveProject, mergeProjectFiles } from '../store/slices/fileSystemSlice';
import { 
    getMyWorkspacesApi, fetchWorkspaceProjectsApi, fetchProjectFilesApi, 
    fetchVirtualViewsApi, generateVirtualViewApi, deleteVirtualViewApi,
    activateVirtualViewApi, deactivateVirtualViewApi 
} from '../utils/api'; 

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

// 📁 원본 트리 컴포넌트
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

// ✨ 가상 트리 컴포넌트
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
    
    // Redux 상태
    const { tree, activeProject, workspaceId, virtualTree } = useSelector(state => state.fileSystem);
    const isVirtualMode = virtualTree !== null && virtualTree !== undefined;

    const [viewMode, setViewMode] = useState('list'); 
    const [workspaces, setWorkspaces] = useState([]);
    const [isLoadingWs, setIsLoadingWs] = useState(true);

    const [savedViews, setSavedViews] = useState([]); 
    const [selectedView, setSelectedView] = useState(null); 
    const [aiPrompt, setAiPrompt] = useState(''); 
    const [isGenerating, setIsGenerating] = useState(false); 

    useEffect(() => {
        if (viewMode === 'list') {
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
            const root = await fetchWorkspaceProjectsApi(targetId);
            dispatch(setWorkspaceId(targetId));
            dispatch(setWorkspaceTree(root));
            
            if (root && root.children && root.children.length > 0) {
                const projectName = root.children[0].name;
                dispatch(setActiveProject(projectName));

                try {
                    const files = await fetchProjectFilesApi(targetId, projectName);
                    dispatch(mergeProjectFiles({ projectName, files }));

                    // 💡 [수정됨] projectName 파라미터 제거, workspaceId만 넘김
                    const views = await fetchVirtualViewsApi(targetId);
                    setSavedViews(Array.isArray(views) ? views : (views ? [views] : []));
                } catch (err) {
                    console.error("데이터 로드 실패:", err);
                }
            }
            setSelectedView(null); 
            setViewMode('detail');
        } catch (e) {
            alert("프로젝트 정보를 불러오지 못했습니다.");
        } finally {
            setIsLoadingWs(false);
        }
    };

    const handleGenerateAiView = async () => {
        if (!aiPrompt.trim() || isGenerating) return;
        setIsGenerating(true);
        try {
            // 💡 [수정됨] 중복 방어 로직을 위해 프롬프트 내용을 viewName으로 활용 (너무 길면 20자 제한)
            const viewName = aiPrompt.length > 20 ? aiPrompt.substring(0, 20) + "..." : aiPrompt;
            
            // 💡 [수정됨] workspaceId, viewName, prompt 를 전달
            const newView = await generateVirtualViewApi(workspaceId, viewName, aiPrompt);
            
            setSavedViews(prev => [newView, ...prev]); // 최신순 정렬을 위해 앞에 추가
            setSelectedView(newView);
            setAiPrompt(''); 
        } catch (error) {
            alert("AI 가상 뷰 생성 오류: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteView = async (viewId) => {
        if(!window.confirm("이 가상 뷰를 삭제하시겠습니까?")) return;
        try {
            await deleteVirtualViewApi(workspaceId, viewId);
            setSavedViews(prev => prev.filter(v => v.id !== viewId));
            if (selectedView?.id === viewId) setSelectedView(null); 
        } catch (error) {
            alert("삭제 실패: " + error.message);
        }
    };

    const handleApply = async () => {
        // 원본 구조 복구 시
        if (selectedView === null) {
            if (!isVirtualMode) return; 
            if(window.confirm("적용된 가상 재배치를 해제하시겠습니까? (IDE가 원본 파일 구조로 돌아갑니다)")) {
                try {
                    // 💡 [수정됨] projectName 불필요
                    await deactivateVirtualViewApi(workspaceId); 
                    dispatch(clearVirtualTree()); 
                    alert("성공적으로 원본 구조로 복구되었습니다.");
                } catch (error) {
                    alert("원본 복구에 실패했습니다: " + error.message);
                }
            }
        } 
        // 가상 뷰 적용 시
        else {
            try {
                // 💡 [수정됨] projectName 불필요, workspaceId와 treeId만 넘김
                await activateVirtualViewApi(workspaceId, selectedView.id); 
                dispatch(setVirtualTree(selectedView.treeData)); 
                alert(`'${selectedView.viewName || selectedView.name || '새로운 가상'}' 뷰가 탐색기에 적용되었습니다!`);
            } catch (error) {
                alert("뷰 적용에 실패했습니다: " + error.message);
            }
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
                                <p className="text-gray-500 font-medium mt-1">가상 폴더 구조를 적용하거나 관리할 워크스페이스를 선택하세요.</p>
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
                                            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all relative group flex flex-col h-[160px]">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <VscFolderOpened className="text-yellow-500 text-3xl drop-shadow-sm" />
                                                    <h3 className="text-lg font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{ws.name}</h3>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono mb-auto">ID: {targetId.substring(0, 13)}...</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-[1400px] w-full mx-auto py-8 px-6 flex flex-col h-full animate-fade-in">
                        <div className="mb-6 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setViewMode('list')} className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors shadow-sm">
                                    <VscChevronLeft size={24} />
                                </button>
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><VscWand size={24} /></div>
                                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    자료 재배치 매니저
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

                        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 flex flex-col overflow-hidden flex-1 mb-4">
                            <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 shrink-0">
                                <h3 className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2 mb-3">
                                    <VscSparkle className="text-blue-600" size={18} /> AI에게 새로운 분류(뷰) 생성을 요청해보세요
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
                                        className="px-8 bg-[#111827] text-white rounded-xl text-[13px] font-bold hover:bg-black transition-all flex items-center justify-center min-w-[140px] shadow-md disabled:bg-gray-400 disabled:shadow-none"
                                    >
                                        {isGenerating ? <VscLoading className="animate-spin" size={18} /> : "✨ AI로 생성하기"}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-gray-200 flex-1 min-h-[500px] overflow-hidden">
                                <div className="w-[320px] bg-[#fafafa] flex flex-col shrink-0">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-white font-extrabold text-[13px] text-gray-700 flex justify-between items-center shadow-sm z-10">
                                        저장된 뷰 목록 (Views)
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                        <div 
                                            onClick={() => setSelectedView(null)}
                                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3
                                            ${selectedView === null ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <VscFolderOpened className={selectedView === null ? 'text-blue-600' : 'text-gray-400'} size={24} />
                                            <div className="flex-1">
                                                <div className={`text-[13px] font-bold ${selectedView === null ? 'text-blue-800' : 'text-gray-700'}`}>실제 탐색기 원본 구조</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">물리적인 실제 폴더 구조</div>
                                            </div>
                                            {!isVirtualMode && <span className="px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-md shadow-sm">IDE 적용중</span>}
                                        </div>

                                        <div className="h-px bg-gray-200 my-4 mx-2"></div>

                                        <div className="px-2 pb-1 text-[11px] font-bold text-gray-400 flex justify-between">
                                            <span>AI 가상 뷰</span>
                                            <span>{savedViews.length}개</span>
                                        </div>
                                        
                                        {savedViews.length === 0 && (
                                            <div className="text-xs text-gray-400 p-4 text-center mt-2 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                                위 입력창에서 AI에게<br/>새로운 뷰 생성을 요청해보세요!
                                            </div>
                                        )}

                                        {savedViews.map(view => (
                                            <div key={view.id} 
                                                onClick={() => setSelectedView(view)}
                                                className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative group
                                                ${selectedView?.id === view.id ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-100 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-1.5 pr-6">
                                                    <VscSparkle className={selectedView?.id === view.id ? 'text-indigo-600' : 'text-gray-400'} size={18} />
                                                    <div className={`text-[13px] font-extrabold truncate ${selectedView?.id === view.id ? 'text-indigo-800' : 'text-gray-700'}`}>
                                                        {view.viewName || view.name || "새로운 가상 뷰"}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-gray-500 truncate pl-6 leading-tight" title={view.prompt}>{view.prompt || "AI가 생성한 가상 폴더 구조"}</p>

                                                {isVirtualMode && virtualTree?.name === (view.viewName || view.name) && (
                                                    <span className="absolute top-3.5 right-3 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-md shadow-sm">IDE 적용중</span>
                                                )}

                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteView(view.id); }}
                                                    className="absolute bottom-2.5 right-3 p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                    title="이 뷰 삭제하기"
                                                >
                                                    <VscTrash size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-[2] bg-white flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/20">
                                    <div className="px-8 py-4 border-b border-gray-200 bg-white flex justify-between items-center z-10 shadow-sm">
                                        <span className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2">
                                            {selectedView === null ? (
                                                <><VscFolderOpened className="text-yellow-500" size={20}/> 원본 구조 프리뷰</>
                                            ) : (
                                                <><VscSparkle className="text-indigo-500" size={20}/> 가상 뷰 프리뷰: <span className="text-indigo-700">{selectedView.viewName || selectedView.name}</span></>
                                            )}
                                        </span>

                                        {selectedView === null ? (
                                            isVirtualMode ? (
                                                <button onClick={handleApply} className="px-5 py-2.5 text-[12px] font-extrabold bg-gray-800 text-white rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-md hover:shadow-lg">
                                                    <VscCheck size={16}/> 원본 구조로 복구 (적용)
                                                </button>
                                            ) : (
                                                <span className="px-4 py-2 text-[12px] font-bold bg-gray-100 text-gray-400 border border-gray-200 rounded-xl flex items-center gap-2 cursor-not-allowed">
                                                    <VscCheck size={16}/> 이미 IDE에 적용되어 있습니다
                                                </span>
                                            )
                                        ) : (
                                            <button onClick={handleApply} className="px-5 py-2.5 text-[12px] font-extrabold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-200 hover:shadow-lg">
                                                <VscCheck size={16}/> 이 가상 뷰를 IDE 탐색기에 적용하기
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="max-w-4xl mx-auto border border-gray-200 rounded-2xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white">
                                            <div className="space-y-1">
                                                {selectedView === null ? (
                                                    tree?.children ? tree.children.map(child => <OriginalTree key={child.id} node={child} />) : <div className="text-xs text-gray-400 p-4">원본 파일이 없습니다.</div>
                                                ) : (
                                                    // 백엔드가 JSON 문자열(treeDataJson)을 파싱해서 줬는지에 따라 방어
                                                    (typeof selectedView.treeDataJson === 'string' ? JSON.parse(selectedView.treeDataJson) : (selectedView.treeDataJson || selectedView.treeData))?.map(folder => <VirtualFolderTree key={folder.id || folder.name} folder={folder} />)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}