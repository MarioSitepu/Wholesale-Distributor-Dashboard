import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

export interface AuthUser {
  username: string;
  role: "admin" | "superadmin";
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

// Post-hydration fix: correct stale role for superadmin in persisted storage
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("wholesale_auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      const storedUser = parsed?.state?.user;
      if (
        storedUser &&
        storedUser.username === "superadmin" &&
        storedUser.role !== "superadmin"
      ) {
        const corrected = { ...storedUser, role: "superadmin" };
        // update persisted storage
        parsed.state = { ...parsed.state, user: corrected };
        localStorage.setItem("wholesale_auth_session", JSON.stringify(parsed));
        // update runtime store if already hydrated
        if (useAuthStore.getState().user?.username === corrected.username) {
          useAuthStore.setState({ user: corrected });
        }
      }
    }
  } catch (e) {
    // non-fatal
    // eslint-disable-next-line no-console
    console.warn("Auth rehydrate fix failed:", e);
  }
}
