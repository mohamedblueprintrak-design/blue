import { create } from "zustand";

interface NavStore {
  currentPage: string;
  currentProjectId: string | null;
  currentProjectTab: string;
  currentProjectSubTab: string;
  setCurrentPage: (page: string) => void;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentProjectTab: (tab: string) => void;
  setCurrentProjectSubTab: (subTab: string) => void;
}

export const useNavStore = create<NavStore>()((set) => ({
  currentPage: "dashboard",
  currentProjectId: null,
  currentProjectTab: "overview",
  currentProjectSubTab: "",
  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentProjectId: (id) => set({ currentProjectId: id, currentProjectTab: "overview", currentProjectSubTab: "" }),
  setCurrentProjectTab: (tab) => set({ currentProjectTab: tab, currentProjectSubTab: "" }),
  setCurrentProjectSubTab: (subTab) => set({ currentProjectSubTab: subTab }),
}));
