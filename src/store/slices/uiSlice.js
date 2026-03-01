<<<<<<< HEAD
// src/store/slices/uiSlice.js
=======
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarVisible: true,
  isTerminalVisible: true,
  isAgentVisible: true,
  isAboutVisible: false,
  isProjectModalVisible: false, 
<<<<<<< HEAD
  isCommandPaletteVisible: false,
  isCodeMapVisible: false, 
  codeMapMode: 'full', // 💡 [추가] 'full' (전체화면) 또는 'split' (분할화면)
=======
  // [추가] 커맨드 팔레트 표시 여부
  isCommandPaletteVisible: false,
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
  
  activeBottomTab: 'terminal', 
  activeActivity: 'editor',
  activeDocsTab: 'api',      
  activeMyPageTab: 'profile',

  isRunning: false,
  isDebugMode: false,
  
  debugLine: null,
  debugVariables: {},
  breakpoints: [],
  
  terminalOutput: null,
  editorCmd: null,
  pendingCreation: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.isSidebarVisible = !state.isSidebarVisible; },
    toggleTerminal: (state) => { state.isTerminalVisible = !state.isTerminalVisible; },
    toggleAgent: (state) => { state.isAgentVisible = !state.isAgentVisible; },
    toggleAbout: (state) => { state.isAboutVisible = !state.isAboutVisible; },
<<<<<<< HEAD
    closeCommandPalette: (state) => { state.isCommandPaletteVisible = false; },
    toggleCommandPalette: (state) => { state.isCommandPaletteVisible = !state.isCommandPaletteVisible; },

    // 💡 [수정] 맵 열기(모드 지정) 및 닫기 액션
    openCodeMap: (state, action) => { 
        state.isCodeMapVisible = true; 
        state.codeMapMode = action.payload; // 'full' or 'split'
    },
    closeCodeMap: (state) => { 
        state.isCodeMapVisible = false; 
    },

=======
    
    // [추가] 커맨드 팔레트 관련 액션
    closeCommandPalette: (state) => { state.isCommandPaletteVisible = false; },
    toggleCommandPalette: (state) => { state.isCommandPaletteVisible = !state.isCommandPaletteVisible; },

>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
    setActiveBottomTab: (state, action) => { state.activeBottomTab = action.payload; },
    setActiveActivity: (state, action) => { state.activeActivity = action.payload; },
    setActiveDocsTab: (state, action) => { state.activeDocsTab = action.payload; },
    setActiveMyPageTab: (state, action) => { state.activeMyPageTab = action.payload; },
    openProjectModal: (state) => { state.isProjectModalVisible = true; },
    closeProjectModal: (state) => { state.isProjectModalVisible = false; },
<<<<<<< HEAD

    setRunning: (state, action) => { 
        state.isRunning = action.payload; 
        if (action.payload) state.activeBottomTab = 'output';
    },
    setDebugMode: (state, action) => { 
        state.isDebugMode = action.payload; 
        if (action.payload) state.activeBottomTab = 'output';
    },
    setCurrentDebugLine: (state, action) => { 
        state.debugLine = action.payload; 
=======
    
    setRunning: (state, action) => { state.isRunning = action.payload; },
    setDebugMode: (state, action) => { state.isDebugMode = action.payload; },
    setCurrentDebugLine: (state, action) => {
        state.debugLine = action.payload;
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
        if (action.payload) state.activeBottomTab = 'output';
    },
    updateDebugVariables: (state, action) => { state.debugVariables = action.payload; },
    toggleBreakpoint: (state, action) => {
        const { path, line } = action.payload;
        const exists = state.breakpoints.find(bp => bp.path === path && bp.line === line);
        if (exists) {
            state.breakpoints = state.breakpoints.filter(bp => bp.path !== path || bp.line !== line);
        } else {
            state.breakpoints.push({ path, line });
        }
    },
<<<<<<< HEAD
    writeToTerminal: (state, action) => { state.terminalOutput = { text: action.payload }; },
    clearTerminalOutput: (state) => { state.terminalOutput = { text: '__CLEAR__' }; },
    triggerEditorCmd: (state, action) => { state.editorCmd = action.payload; },
=======

    writeToTerminal: (state, action) => { state.terminalOutput = { text: action.payload }; },
    clearTerminalOutput: (state) => { state.terminalOutput = { text: '__CLEAR__' }; },
    triggerEditorCmd: (state, action) => { state.editorCmd = action.payload; },
    
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
    startCreation: (state, action) => { state.pendingCreation = action.payload; },
    endCreation: (state) => { state.pendingCreation = null; }
  },
});

<<<<<<< HEAD
=======
// [수정] closeCommandPalette, toggleCommandPalette 내보내기 추가
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
export const { 
    toggleSidebar, toggleTerminal, toggleAgent, toggleAbout, setActiveBottomTab, setActiveActivity,
    setActiveDocsTab, setActiveMyPageTab, openProjectModal, closeProjectModal, 
    setRunning, setDebugMode, setCurrentDebugLine, updateDebugVariables, toggleBreakpoint,
    writeToTerminal, clearTerminalOutput, triggerEditorCmd, startCreation, endCreation,
<<<<<<< HEAD
    closeCommandPalette, toggleCommandPalette, openCodeMap, closeCodeMap
=======
    closeCommandPalette, toggleCommandPalette
>>>>>>> 92418e7ef41ca5cb3e39631db7edbf9a402fcbb7
} = uiSlice.actions;

export default uiSlice.reducer;