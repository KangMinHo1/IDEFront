import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    VscFolder, VscFolderOpened, VscFile, VscWand, VscCheck, VscClose,
    VscChevronRight, VscChevronDown, VscArrowRight
} from "react-icons/vsc";
import { DiReact, DiJsBadge, DiPython, DiJava, DiMarkdown } from "react-icons/di";

// 💡 메뉴바를 이 페이지에서도 띄우기 위해 불러옵니다.
// (만약 ResourceRelocation.jsx 파일이 components 폴더에 있다면 import MenuBar from './MenuBar'; 로 변경해주세요)
import MenuBar from '../components/MenuBar'; 

const getFileIcon = (name) => {
    if (!name) return <VscFile className="text-gray-400" />;
    const ext = name.split('.').pop().toLowerCase();
    switch(ext) {
        case 'java': return <DiJava className="text-orange-500 text-lg" />;
        case 'py': return <DiPython className="text-blue-500 text-lg" />;
        case 'js': return <DiJsBadge className="text-yellow-400 text-lg" />;
        case 'jsx': return <DiReact className="text-blue-400 text-lg" />;
        case 'md': return <DiMarkdown className="text-gray-500 text-lg" />;
        default: return <VscFile className="text-gray-500 text-lg" />;
    }
};

export default function ResourceRelocation() {
    const navigate = useNavigate();
    const { tree, activeProject } = useSelector(state => state.fileSystem);

    const flatFiles = useMemo(() => {
        const extractFiles = (nodesArr, parentPath = '') => {
            let result = [];
            if (!nodesArr) return result;
            const target = Array.isArray(nodesArr) ? nodesArr : [nodesArr];
            
            target.forEach(n => {
                if (String(n.type || '').toLowerCase() === 'file') {
                    result.push({ ...n, originalPath: parentPath || '/' });
                } else if (n.children) {
                    const nextPath = parentPath ? `${parentPath}/${n.name}` : n.name;
                    result = result.concat(extractFiles(n.children, nextPath));
                }
            });
            return result;
        };
        return extractFiles(tree);
    }, [tree]);

    const aiProposedDraft = useMemo(() => {
        const groups = {
            "Java (Spring Boot)": [],
            "JavaScript & React": [],
            "Python": [],
            "Documents & Configs": [],
            "Others": []
        };

        flatFiles.forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'java') groups["Java (Spring Boot)"].push(file);
            else if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) groups["JavaScript & React"].push(file);
            else if (ext === 'py') groups["Python"].push(file);
            else if (['md', 'txt', 'json', 'xml', 'yml', 'yaml'].includes(ext)) groups["Documents & Configs"].push(file);
            else groups["Others"].push(file);
        });

        return Object.fromEntries(Object.entries(groups).filter(([_, files]) => files.length > 0));
    }, [flatFiles]);

    const [expandedFolders, setExpandedFolders] = useState([]); 
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isApplied, setIsApplied] = useState(false);

    useEffect(() => {
        setExpandedFolders(Object.keys(aiProposedDraft));
        setSelectedFiles(flatFiles.map(f => f.id));
    }, [aiProposedDraft, flatFiles]);

    const toggleFolder = (folderName) => {
        setExpandedFolders(prev => prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]);
    };

    const toggleFileSelection = (fileId) => {
        setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };

    const handleApply = () => {
        setIsApplied(true);
    };

    // 적용된 파일들을 담은 최종 구조
    const finalStructure = useMemo(() => {
        return Object.entries(aiProposedDraft).map(([folderName, files]) => {
            const keptFiles = files.filter(f => selectedFiles.includes(f.id));
            return { folderName, files: keptFiles };
        }).filter(folder => folder.files.length > 0);
    }, [aiProposedDraft, selectedFiles]);

    return (
        // 💡 1. 화면 전체를 꽉 채우도록 h-screen w-screen 적용
        <div className="w-screen h-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden">
            
            {/* 💡 2. 최상단에 메뉴바 고정 렌더링 */}
            <MenuBar />

            {/* 💡 3. 하단 콘텐츠 영역은 스크롤 가능하도록 처리 */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl w-full mx-auto py-10 px-6 flex flex-col">
                    
                    {/* 상단 타이틀 영역 */}
                    <div className="mb-6 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><VscWand size={24} /></div>
                            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                AI 자료 재배치
                                {activeProject && (
                                    <span className="text-[13px] font-bold bg-gray-800 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <VscFolderOpened /> {activeProject}
                                    </span>
                                )}
                            </h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                            현재 워크스페이스의 실제 파일 구조를 분석하여 언어별로 분류한 초안입니다.<br/>
                            재배치를 원하지 않는 파일은 <span className="text-blue-600 font-bold">체크를 해제하여 제외</span>할 수 있습니다.
                        </p>
                    </div>

                    {/* 프로젝트 파일이 없을 때 */}
                    {flatFiles.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 font-bold">
                            프로젝트에 분석할 파일이 없습니다. 에디터에서 파일을 먼저 생성해주세요.
                        </div>
                    ) : !isApplied ? (
                        /* 💡 듀얼 뷰: 적용 전 화면 */
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-b border-gray-200 min-h-[400px]">
                                {/* [LEFT] Before */}
                                <div className="flex-1 bg-[#fafafa]">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                        <span className="text-sm font-extrabold text-gray-500 tracking-wide">📦 현재 구조 (Before)</span>
                                    </div>
                                    <div className="p-6 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {flatFiles.map(file => (
                                            <div key={file.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-white border border-gray-100 shadow-sm opacity-60">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span>{getFileIcon(file.name)}</span>
                                                    <span className="text-sm font-medium text-gray-500 line-through decoration-gray-300 truncate" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={file.originalPath}>
                                                    {file.originalPath}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* [CENTER] Arrow */}
                                <div className="hidden md:flex items-center justify-center bg-white w-12 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><VscArrowRight size={18} /></div>
                                </div>

                                {/* [RIGHT] After */}
                                <div className="flex-[1.5] bg-white">
                                    <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                                        <span className="text-sm font-extrabold text-blue-700 tracking-wide flex items-center gap-2">✨ AI 재배치 초안 (After)</span>
                                        <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">
                                            선택됨: {selectedFiles.length} / {flatFiles.length}
                                        </span>
                                    </div>
                                    <div className="p-6 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {Object.entries(aiProposedDraft).map(([folderName, files]) => {
                                            const isExpanded = expandedFolders.includes(folderName);
                                            return (
                                                <div key={folderName} className="select-none">
                                                    <div onClick={() => toggleFolder(folderName)} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                        <span className="text-gray-400">{isExpanded ? <VscChevronDown size={18} /> : <VscChevronRight size={18} />}</span>
                                                        <span className="text-blue-500">{isExpanded ? <VscFolderOpened size={20} /> : <VscFolder size={20} />}</span>
                                                        <span className="font-bold text-gray-800 text-[15px]">{folderName}</span>
                                                        <span className="ml-2 text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{files.length} items</span>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="ml-6 pl-4 border-l-2 border-blue-100 py-1 space-y-1 animate-slide-down">
                                                            {files.map(file => {
                                                                const isChecked = selectedFiles.includes(file.id);
                                                                return (
                                                                    <div key={file.id} className={`flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${isChecked ? 'hover:bg-blue-50' : 'opacity-50 hover:bg-gray-50'}`} onClick={() => toggleFileSelection(file.id)}>
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'}`}>
                                                                            {isChecked && <VscCheck size={12} strokeWidth={1} />}
                                                                        </div>
                                                                        <span className="flex items-center gap-2 flex-1 min-w-0">
                                                                            {getFileIcon(file.name)}
                                                                            <span className={`text-[13px] font-medium transition-colors truncate ${isChecked ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                                                                {file.name}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 font-mono truncate hidden md:inline-block">
                                                                                from {file.originalPath}
                                                                            </span>
                                                                        </span>
                                                                        {isChecked && <span className="ml-auto shrink-0 text-[10px] text-blue-500 font-bold px-2 bg-blue-50 rounded">이동 예정</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 하단 적용 버튼 */}
                            <div className="bg-gray-50 px-6 py-5 flex justify-end gap-3">
                                <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                                    <VscClose size={18} /> 뒤로가기
                                </button>
                                <button onClick={handleApply} disabled={selectedFiles.length === 0} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:bg-gray-400 disabled:shadow-none">
                                    <VscCheck size={18} /> {selectedFiles.length}개 파일 재배치 가상 적용
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 💡 2번째 이미지 레이아웃: 적용 완료 후 화면 */
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in flex flex-col">
                            
                            {/* 상단 완료 알림 배너 */}
                            <div className="bg-[#f0fdf4] px-8 py-6 flex items-center gap-4 border-b border-green-100">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm border border-green-200 shrink-0">
                                    <VscCheck size={24} strokeWidth={1} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-green-800 mb-0.5">재배치 시뮬레이션 완료</h2>
                                    <p className="text-green-600 text-[13px]">선택하신 {selectedFiles.length}개의 파일이 아래와 같은 새로운 구조로 정리되었습니다.</p>
                                </div>
                            </div>

                            {/* 최종 결과 단일 트리 영역 */}
                            <div className="p-8 bg-[#f8fafc] flex-1">
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-2xl mx-auto">
                                    <h3 className="text-[13px] font-bold text-blue-500 mb-4 tracking-wide border-b border-gray-100 pb-3 flex items-center gap-2">
                                        <VscFolderOpened size={18} />
                                        최종 폴더 구조 미리보기
                                    </h3>
                                    
                                    <div className="space-y-6 mt-4">
                                        {finalStructure.map(folder => (
                                            <div key={folder.folderName}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <VscFolderOpened size={20} className="text-blue-600" />
                                                    <span className="font-bold text-gray-800 text-[15px]">{folder.folderName}</span>
                                                </div>
                                                <div className="ml-4 space-y-2">
                                                    {folder.files.map(file => (
                                                        <div key={file.id} className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                <span>{getFileIcon(file.name)}</span>
                                                                <span className="text-[13px] font-medium text-gray-700 truncate">{file.name}</span>
                                                            </div>
                                                            <span className="text-[11px] text-gray-300 font-mono">
                                                                (← Projects/{file.originalPath === '/' ? activeProject : file.originalPath})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 하단 에디터 복귀 버튼 */}
                            <div className="bg-[#f8fafc] px-8 py-6 flex justify-center pb-8">
                                <button onClick={() => navigate('/')} className="px-8 py-3 bg-[#111827] text-white text-[14px] font-bold rounded-lg hover:bg-black transition-colors flex items-center gap-2 shadow-md">
                                    IDE 화면으로 돌아가기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}