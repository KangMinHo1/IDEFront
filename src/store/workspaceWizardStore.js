import { create } from 'zustand';

export const useWorkspaceWizardStore = create((set) => ({
  step: 1,
  wsName: "",
  wsDesc: "",
  wsPath: "C:\\Users\\user\\source\\repos",
  wsType: null, // 'personal' | 'team' 고정됨
  invitedEmails: [],
  language: "",
  projName: "",
  projDesc: "",
  gitRepo: "",

  setStep: (step) => set({ step }),
  setData: (data) => set((state) => ({ ...state, ...data })),
  addEmail: (email) => set((state) => ({ invitedEmails: [...state.invitedEmails, email] })),
  reset: () => set({ 
    step: 1, wsName: "", wsDesc: "", wsType: null, 
    language: "", projName: "", projDesc: "", gitRepo: "", invitedEmails: [] 
  }),
}));