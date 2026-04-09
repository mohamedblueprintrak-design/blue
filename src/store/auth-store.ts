import { create } from "zustand";
import { persist } from "zustand/middleware";

const COOKIE_NAME = "blueprint-auth-token";

function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, token) => {
        if (token) {
          setAuthCookie(token);
        }
        set({
          user,
          isAuthenticated: true,
        });
      },
      logout: () => {
        clearAuthCookie();
        set({
          user: null,
          isAuthenticated: false,
        });
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: "blueprint-auth",
    }
  )
);
