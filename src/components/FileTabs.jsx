import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { VscClose, VscFile } from "react-icons/vsc";
import { setActiveFile, closeFile } from '../store/slices/fileSystemSlice';
import { DiJava, DiPython, DiJsBadge, DiReact } from "react-icons/di";

const getFileIcon = (name) => {
    if (!name) return <VscFile className="text-gray-400" />;
    const ext = name.split('.').pop().toLowerCase();
    switch(ext) {
      case 'java': return <DiJava className="text-red-500" />;
      case 'py': return <DiPython className="text-[#3776ab]" />;
      case 'js': return <DiJsBadge className="text-[#f7df1e]" />;
      case 'jsx': return <DiReact className="text-[#61dafb]" />;
      default: return <VscFile className="text-gray-400" />;
    }
};

export default function FileTabs() {
    const dispatch = useDispatch();
    const { openFiles, activeFileId } = useSelector(state => state.fileSystem);

    if (openFiles.length === 0) return <div className="h-9 bg-[#f3f3f3] border-b border-gray-200"></div>;

    return (
        <div className="flex h-9 bg-[#f3f3f3] overflow-x-auto border-b border-gray-200 scrollbar-hide">
            {openFiles.map((file) => (
                <div 
                    key={file.id}
                    className={`flex items-center px-3 min-w-[120px] max-w-[200px] border-r border-gray-200 cursor-pointer select-none text-xs group transition-all
                        ${activeFileId === file.id 
                            ? 'bg-white text-[#333] border-t-2 border-t-blue-500 font-medium' // 활성 탭
                            : 'bg-[#ececec] text-gray-500 hover:bg-[#e6e6e6] border-t-2 border-t-transparent' // 비활성 탭
                        }`}
                    onClick={() => dispatch(setActiveFile(file.id))}
                >
                    <span className="mr-2 text-base">{getFileIcon(file.name)}</span>
                    <span className="truncate flex-1">{file.name}</span>
                    <span 
                        className={`ml-2 p-0.5 rounded-sm hover:bg-gray-300 text-gray-500 transition-opacity ${activeFileId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => { e.stopPropagation(); dispatch(closeFile(file.id)); }}
                    >
                        <VscClose />
                    </span>
                </div>
            ))}
        </div>
    );
}