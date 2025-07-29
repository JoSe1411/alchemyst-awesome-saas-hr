import { create } from 'zustand';

type PanelMode = 'chat' | 'jd' | 'interview';

interface RightPanelState {
  mode: PanelMode;
  setMode: (mode: PanelMode) => void;
}

export const useRightPanelStore = create<RightPanelState>((set) => ({
  mode: 'chat',
  setMode: (mode) => set({ mode }),
})); 