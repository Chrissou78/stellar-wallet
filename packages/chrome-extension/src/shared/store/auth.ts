import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLocked: boolean;
  hasPassword: boolean;
  _passwordHash: string | null;

  setPassword: (password: string) => void;
  verifyPassword: (password: string) => boolean;
  lock: () => void;
  unlock: () => void;
  logout: () => void;
}

// Simple hash for client-side password verification
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Add salt-like suffix with length
  return `${hash.toString(36)}_${password.length}_${password.charCodeAt(0).toString(36)}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLocked: true,
      hasPassword: false,
      _passwordHash: null,

      setPassword: (password: string) => {
        const hashed = hashPassword(password);
        set({ _passwordHash: hashed, hasPassword: true, isLocked: false });
      },

      verifyPassword: (password: string) => {
        const hashed = hashPassword(password);
        return hashed === get()._passwordHash;
      },

      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),

      logout: () => set({
        isLocked: true,
        hasPassword: false,
        _passwordHash: null,
      }),
    }),
    {
      name: "stellar-wallet-auth",
      partialize: (state) => ({
        hasPassword: state.hasPassword,
        _passwordHash: state._passwordHash,
        isLocked: true, // always locked on reload
      }),
    }
  )
);