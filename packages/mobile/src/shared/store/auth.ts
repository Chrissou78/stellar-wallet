import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://stellar-wallet.onrender.com";

export interface UserProfile {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  preferredLanguage: string;
  preferredNetwork: string;
}

interface AuthState {
  // JWT auth
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Local PIN
  pinHash: string | null;
  hasPin: boolean;
  isLocked: boolean;

  // Actions — JWT
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshSession: () => Promise<boolean>;

  // Actions — PIN
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  lock: () => void;
  unlock: (pin: string) => boolean;
  clearPin: () => void;
}

// Simple hash for local PIN (not sent to server)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Add a second pass for slightly better distribution
  const str = pin + "stellar-wallet-pin-salt" + pin;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash2 = ((hash2 << 5) - hash2 + str.charCodeAt(i)) | 0;
  }
  return `${hash.toString(36)}-${hash2.toString(36)}`;
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      pinHash: null,
      hasPin: false,
      isLocked: true,

      register: async (email, password, firstName, lastName) => {
        const data = await apiRequest("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, firstName, lastName }),
        });
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLocked: false,
        });
      },

      login: async (email, password) => {
        const data = await apiRequest("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          // If user already has a PIN, stay locked so they must enter it
          isLocked: get().hasPin,
        });
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await apiRequest("/api/v1/auth/logout", {
              method: "POST",
              body: JSON.stringify({ refreshToken }),
            });
          }
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          pinHash: null,
          hasPin: false,
          isLocked: true,
        });
      },

      loadProfile: async () => {
        const { accessToken, refreshSession } = get();
        if (!accessToken) return;

        try {
          const data = await apiRequest("/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          set({ user: data, isAuthenticated: true });
        } catch {
          // Token expired — try refresh
          const refreshed = await refreshSession();
          if (refreshed) {
            try {
              const data = await apiRequest("/api/v1/auth/me", {
                headers: { Authorization: `Bearer ${get().accessToken}` },
              });
              set({ user: data, isAuthenticated: true });
            } catch {
              set({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null });
            }
          }
        }
      },

      updateProfile: async (updates) => {
        const { accessToken } = get();
        const data = await apiRequest("/api/v1/auth/profile", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(updates),
        });
        set({ user: { ...get().user!, ...data } });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const data = await apiRequest("/api/v1/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          return true;
        } catch {
          set({
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            user: null,
          });
          return false;
        }
      },

      // PIN methods
      setPin: (pin) => {
        set({ pinHash: hashPin(pin), hasPin: true, isLocked: false });
      },

      verifyPin: (pin) => {
        return hashPin(pin) === get().pinHash;
      },

      lock: () => {
        set({ isLocked: true });
      },

      unlock: (pin) => {
        if (hashPin(pin) === get().pinHash) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      clearPin: () => {
        set({ pinHash: null, hasPin: false, isLocked: false });
      },
    }),
    {
      name: "stellar-wallet-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        pinHash: state.pinHash,
        hasPin: state.hasPin,
        isLocked: state.isLocked,
      }),
    }
  )
);
