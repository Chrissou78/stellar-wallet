import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, setTokens, clearTokens, getAccessToken } from "../lib/api";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  preferredLanguage: string;
  preferredNetwork: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    preferredLanguage?: string;
    preferredNetwork?: string;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      register: async (data) => {
        const res = await authApi.register(data);
        setTokens(res.accessToken, res.refreshToken);
        set({ user: res.user, isAuthenticated: true });
      },

      login: async (email, password) => {
        const res = await authApi.login(email, password);
        setTokens(res.accessToken, res.refreshToken);
        set({ user: res.user, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore
        }
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      loadProfile: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const res = await authApi.me();
          set({ user: res.user, isAuthenticated: true });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const res = await authApi.updateProfile(data);
        set({ user: res.user });
      },

      changePassword: async (currentPassword, newPassword) => {
        await authApi.changePassword(currentPassword, newPassword);
      },
    }),
    {
      name: "stellar-ext-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);