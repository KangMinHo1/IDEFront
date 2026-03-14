import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workspaceId: null,
  activeProject: null,       
  activeBranch: "master",
  projectList: [],           
  tree: null, 
  openFiles: [],
  activeFileId: null,
  fileContents: {},
  expandedFolders: [],
  activeGitView: 'status', 
  
  // 💡 [추가] AI 어시스트용 상태 공간 (주문서와 영수증을 보관할 서랍)
  aiSuggestion: {
      originalCode: null,   // 수락하기 전의 원래 코드
      suggestedCode: null,  // AI가 짜준 새로운 코드
      isDiffMode: false,    // 에디터를 Diff 모드로 바꿀지 여부 (스위치)
      targetPath: null,     // 현재 AI 작업을 하고 있는 파일 경로
      explanation: ""       // AI의 설명 (왜 이렇게 짰는지)
  }
};

const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    setWorkspaceId: (state, action) => { state.workspaceId = action.payload; },
    setProjectList: (state, action) => {
        state.projectList = action.payload.map(p => 
            typeof p === 'string' ? { name: p, gitUrl: null } : p
        );
    },
    updateProjectGitInfo: (state, action) => {
        const { projectName, gitUrl } = action.payload;
        const project = state.projectList.find(p => p.name === projectName);
        if (project) { project.gitUrl = gitUrl; }
    },
    setWorkspaceTree: (state, action) => { state.tree = action.payload; },
    setActiveProject: (state, action) => { state.activeProject = action.payload; },
    setActiveBranch: (state, action) => { state.activeBranch = action.payload; },
    
    setActiveGitView: (state, action) => { state.activeGitView = action.payload; },
    
    openCodeMapTab: (state) => {
        const mapId = 'virtual:codemap';
        if (!state.openFiles.find(f => f.id === mapId)) {
            state.openFiles.push({ 
                id: mapId, 
                name: 'Architecture Map',
                type: 'virtual' 
            });
        }
        state.activeFileId = mapId;
    },

    mergeProjectFiles: (state, action) => {
        const { projectName, files } = action.payload;
        if (state.tree && state.tree.children) {
            const projectNode = state.tree.children.find(p => p.name === projectName);
            if (projectNode) {
                projectNode.children = Array.isArray(files) 
                    ? files 
                    : (files && files.children ? files.children : [files]);
            }
        }
    },
    openFile: (state, action) => {
        const fileNode = action.payload;
        state.activeFileId = fileNode.id;
        if (!state.openFiles.find(f => f.id === fileNode.id)) {
            state.openFiles.push({ id: fileNode.id, name: fileNode.name });
        }
    },
    toggleFolder: (state, action) => {
        const folderId = action.payload;
        if (state.expandedFolders.includes(folderId)) {
            state.expandedFolders = state.expandedFolders.filter(id => id !== folderId);
        } else {
            state.expandedFolders.push(folderId);
        }
    },
    setActiveFile: (state, action) => {
        const fileId = action.payload;
        state.activeFileId = fileId;
        if (!state.openFiles.find(f => f.id === fileId)) {
            const fileName = fileId.split('/').pop();
            state.openFiles.push({ id: fileId, name: fileName });
        }
    },
    closeFile: (state, action) => {
        const fileId = action.payload;
        state.openFiles = state.openFiles.filter(f => f.id !== fileId);
        if (state.activeFileId === fileId) {
            state.activeFileId = state.openFiles.length > 0 
                ? state.openFiles[state.openFiles.length - 1].id 
                : null;
        }
    },
    closeFilesByPath: (state, action) => {
        const deletedPath = action.payload;
        state.openFiles = state.openFiles.filter(f => 
            f.id !== deletedPath && !f.id.startsWith(deletedPath + "/")
        );
        if (state.activeFileId && (state.activeFileId === deletedPath || state.activeFileId.startsWith(deletedPath + "/"))) {
             state.activeFileId = state.openFiles.length > 0 
                ? state.openFiles[state.openFiles.length - 1].id 
                : null;
        }
        Object.keys(state.fileContents).forEach(key => {
             if (key === deletedPath || key.startsWith(deletedPath + "/")) {
                 delete state.fileContents[key];
             }
        });
    },
    closeAllFiles: (state) => {
        state.openFiles = [];
        state.activeFileId = null;
        state.fileContents = {};
    },
    updateFileContent: (state, action) => {
        const { filePath, content } = action.payload;
        state.fileContents[filePath] = content;
    },

    // =====================================================================
    // 💡 [추가] AI 어시스트용 Reducer 액션 함수들 (상태 조작)
    // =====================================================================
    
    // 1. AI 응답을 받아서 Diff 뷰를 켜기 위해 데이터를 저장하는 함수
    setAiSuggestion: (state, action) => {
        state.aiSuggestion = {
            ...state.aiSuggestion,
            ...action.payload,
            isDiffMode: true // ⬅️ 이 값이 true가 되면 에디터 화면이 반으로 갈라집니다!
        };
    },
    
    // 2. 수락/거절을 누른 후, AI 서랍을 깨끗하게 비우고 일반 에디터로 돌아가는 함수
    clearAiSuggestion: (state) => {
        state.aiSuggestion = {
            originalCode: null,
            suggestedCode: null,
            isDiffMode: false,
            targetPath: null,
            explanation: ""
        };
    }
  },
});

export const { 
    setWorkspaceId, setActiveProject, setActiveBranch, setProjectList,
    setWorkspaceTree, updateProjectGitInfo, setActiveFile, closeFile, 
    closeFilesByPath, closeAllFiles, updateFileContent, toggleFolder, mergeProjectFiles, openFile,
    setActiveGitView, openCodeMapTab,
    setAiSuggestion, clearAiSuggestion // 💡 내보내기 추가!
} = fileSystemSlice.actions;

export default fileSystemSlice.reducer;