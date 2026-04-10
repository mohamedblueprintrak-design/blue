import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRolePermissions } from "@/lib/auth/modules/authorization";

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

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  position?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[] | string) => boolean;
  stopAutoRefresh: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
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
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true, isLoading: false, isInitialized: true });
            return { success: true };
          }
          set({ isLoading: false });
          return { success: false, error: result.error?.message || 'Registration failed' };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Network error' };
        }
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      refreshUser: async () => {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          const result = await response.json();
          if (result.success && result.user) {
            set({ user: result.user, isAuthenticated: true, isInitialized: true });
          }
        } catch {
          // Refresh failed silently
        }
      },
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true;
        try {
          const rolePerms = getRolePermissions(user.role as any);
          return rolePerms.includes(permission as any);
        } catch {
          return false;
        }
      },
      hasRole: (roles: string[] | string) => {
        const { user } = get();
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },
      stopAutoRefresh: () => {
        if (refreshIntervalId) {
          clearInterval(refreshIntervalId);
          refreshIntervalId = null;
        }
      },
    }),
    {
      name: "blueprint-auth",
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.isInitialized = true;
            useAuthStore.setState({ isInitialized: true });
          }
        };
      },
    }
  )
);

// Auto-refresh: poll /api/auth/me every 4 minutes while authenticated
let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

useAuthStore.subscribe((state) => {
  if (state.isAuthenticated && !refreshIntervalId) {
    refreshIntervalId = setInterval(() => {
      useAuthStore.getState().refreshUser();
    }, 240000);
  } else if (!state.isAuthenticated && refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
});

// Initialize store from cookie on module load
if (typeof window !== 'undefined') {
  useAuthStore.getState().refreshUser();
}
