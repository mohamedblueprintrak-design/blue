import { create } from "zustand";

interface NavStore {
  currentPage: string;
  currentProjectId: string | null;
  currentProjectTab: string;
  setCurrentPage: (page: string) => void;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentProjectTab: (tab: string) => void;
}

export const useNavStore = create<NavStore>()((set) => ({
  currentPage: "dashboard",
  currentProjectId: null,
  currentProjectTab: "overview",
  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setCurrentProjectTab: (tab) => set({ currentProjectTab: tab }),
}));
