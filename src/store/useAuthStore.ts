import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

export interface AuthUser {
  username: string;
  role: "admin";
  branch: string;
}

interface AuthStore {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const removeLegacyCurrentUser = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("currentUser");
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user: AuthUser) => {
        removeLegacyCurrentUser();
        set({ user });
      },
      logout: () => {
        removeLegacyCurrentUser();
        set({ user: null });
      },
    }),
    {
      name: "wholesale_auth_session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      onRehydrateStorage: () => {
        removeLegacyCurrentUser();
      },
    },
  ),
);
