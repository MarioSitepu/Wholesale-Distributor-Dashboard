import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

interface AppStore {
  activeBranch: string;
  selectedCategory: string;
  setActiveBranch: (branch: string) => void;
  setSelectedCategory: (category: string) => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeBranch: "",
      selectedCategory: "",
      setActiveBranch: (branch: string) => set({ activeBranch: branch }),
      setSelectedCategory: (category: string) =>
        set({ selectedCategory: category }),
    }),
    {
      name: "wholesale_app_session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
    },
  ),
);
