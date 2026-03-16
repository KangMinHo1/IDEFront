import { create } from 'zustand';

export const useWorkspaceWizardStore = create((set) => ({
  step: 1,
  wsName: "",
  wsDesc: "",
  wsPath: "C:\\WebIDE\\workspaces",
  wsType: null, 
  invitedEmails: [],
  language: "",
  projName: "",
  projDesc: "",
  gitRepo: "",

  setStep: (step) => set({ step }),
  setData: (data) => set((state) => ({ ...state, ...data })),
  
  // 💡 [개선] 이메일 추가 시 중복 방지 로직 추가
  addEmail: (email) => set((state) => {
    if (state.invitedEmails.includes(email)) return state; 
    return { invitedEmails: [...state.invitedEmails, email] };
  }),
  
  // 💡 [신규 추가] 이메일 삭제 함수
  removeEmail: (emailToRemove) => set((state) => ({
    invitedEmails: state.invitedEmails.filter(email => email !== emailToRemove)
  })),

  reset: () => set({ 
    step: 1, 
    wsName: "", 
    wsDesc: "", 
    wsPath: "C:\\WebIDE\\workspaces", 
    wsType: null, 
    language: "", 
    projName: "", 
    projDesc: "", 
    gitRepo: "", 
    invitedEmails: [] 
  }),
}));