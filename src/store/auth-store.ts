import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRolePermissions } from "@/lib/auth/modules/authorization";
import { Permission } from "@/lib/auth/types";

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
  login: (user: User) => void;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (data: Partial<User>) => void;
  refreshSession: () => Promise<void>;
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
      login: (user) => {
        // No manual cookie setting — server sets httpOnly cookie
        set({
          user,
          isAuthenticated: true,
        });
      },
      logout: async () => {
        // Clear httpOnly cookie via server endpoint
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // Network error — clear local state anyway
        }
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
        } catch {
          set({ isLoading: false });
          return { success: false, error: 'Network error' };
        }
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      refreshSession: async () => {
        try {
          const response = await fetch('/api/auth/session', {
            method: 'GET',
            credentials: 'include',
          });
          const result = await response.json();
          if (result.success && result.isAuthenticated && result.user) {
            set({ user: result.user, isAuthenticated: true, isInitialized: true });
          } else {
            set({ user: null, isAuthenticated: false, isInitialized: true });
          }
        } catch {
          // Session check failed silently
        }
      },
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true;
        try {
          const rolePerms = getRolePermissions(user.role);
          return rolePerms.includes(permission as Permission);
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

// Auto-refresh: poll /api/auth/session every 4 minutes while authenticated
let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

useAuthStore.subscribe((state) => {
  if (state.isAuthenticated && !refreshIntervalId) {
    refreshIntervalId = setInterval(() => {
      useAuthStore.getState().refreshSession();
    }, 240000);
  } else if (!state.isAuthenticated && refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
});

// Initialize store from httpOnly cookie via /api/auth/session on module load
if (typeof window !== 'undefined') {
  useAuthStore.getState().refreshSession();
}
