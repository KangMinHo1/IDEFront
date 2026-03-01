import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    VscSourceControl, VscRepo, VscRepoForked, VscRecord, VscHistory, VscChevronDown, VscChevronRight 
} from "react-icons/vsc";

import { setActiveProject, setActiveBranch, closeAllFiles, setActiveGitView } from '../store/slices/fileSystemSlice';
import { fetchBranchListApi } from '../utils/api';

export default function GitPanel() {
    const dispatch = useDispatch();
    const { workspaceId, activeProject, activeBranch, projectList, activeGitView } = useSelector(state => state.fileSystem);
    
    const [branchList, setBranchList] = useState([]);
    const [isBranchExpanded, setIsBranchExpanded] = useState(true);

    useEffect(() => {
        if (workspaceId && activeProject) {
            fetchBranchListApi(workspaceId, activeProject).then(setBranchList).catch(console.error);
        } else {
            setBranchList([]);
        }
    }, [workspaceId, activeProject]);

    const handleProjectChange = (e) => {
        dispatch(setActiveProject(e.target.value));
        dispatch(setActiveBranch("main-repo"));
        dispatch(setActiveGitView('status')); 
    };

    const handleBranchChange = (branchName) => {
        if (branchName !== activeBranch) {
            dispatch(closeAllFiles());
            dispatch(setActiveBranch(branchName));
        }
    };

    return (
        <div className="h-full w-full bg-[#f8f9fa] flex flex-col font-sans border-r border-gray-200">
            {/* 1. 헤더 */}
            <div className="flex items-center px-4 h-9 border-b border-gray-200 shrink-0">
                <VscSourceControl size={14} className="text-gray-700 mr-2"/>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">소스 제어 (Git)</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {/* 2. 프로젝트 선택 */}
                <div className="mb-4 border border-gray-200 rounded bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <VscRepo size={14} className="text-blue-600 mr-2" />
                        <span className="text-xs font-bold text-gray-700">Project</span>
                    </div>
                    <select 
                        value={activeProject || ""} onChange={handleProjectChange}
                        className="w-full text-xs p-2 outline-none cursor-pointer bg-white"
                    >
                        <option value="" disabled>프로젝트 선택</option>
                        {projectList?.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                </div>

                {/* 3. 메뉴 선택 (Status / History) */}
                <div className="mb-6">
                    <div className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider px-1">Workspace</div>
                    
                    <div 
                        onClick={() => dispatch(setActiveGitView('status'))}
                        className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-xs transition-colors mb-1 ${activeGitView === 'status' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        <VscRecord size={16}/> <span>File Status</span>
                    </div>

                    <div 
                        onClick={() => dispatch(setActiveGitView('history'))}
                        className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-xs transition-colors ${activeGitView === 'history' ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                        <VscHistory size={16}/> <span>Commit History</span>
                    </div>
                </div>

                {/* 4. 브랜치 선택 */}
                <div>
                    <div 
                        className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider px-1 cursor-pointer hover:text-gray-800"
                        onClick={() => setIsBranchExpanded(!isBranchExpanded)}
                    >
                        <div className="flex items-center gap-1">
                            {isBranchExpanded ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />}
                            <span>Branches</span>
                        </div>
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{branchList.length}</span>
                    </div>
                    
                    {isBranchExpanded && (
                        <div className="mt-1 flex flex-col gap-0.5 border-l border-gray-300 ml-2.5 pl-2">
                            {branchList.map(branch => (
                                <div 
                                    key={branch} onClick={() => handleBranchChange(branch)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${branch === (activeBranch || 'main-repo') ? 'text-blue-700 font-bold bg-blue-50' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <VscRepoForked size={14} className={branch === (activeBranch || 'main-repo') ? "text-blue-600" : "text-gray-400"}/> 
                                    <span className="truncate">{branch}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}