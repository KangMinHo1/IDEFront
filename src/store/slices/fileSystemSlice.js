import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workspaceId: null,
  activeProject: null,       
  activeBranch: "master",  // 💡 [수정] 기본 브랜치를 master로 변경!
  projectList: [],           
  tree: null, 
  openFiles: [],
  activeFileId: null,
  fileContents: {},
  expandedFolders: [],
  activeGitView: 'status', 
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
  },
});

export const { 
    setWorkspaceId, setActiveProject, setActiveBranch, setProjectList,
    setWorkspaceTree, updateProjectGitInfo, setActiveFile, closeFile, 
    closeFilesByPath, closeAllFiles, updateFileContent, toggleFolder, mergeProjectFiles, openFile,
    setActiveGitView
} = fileSystemSlice.actions;

export default fileSystemSlice.reducer;