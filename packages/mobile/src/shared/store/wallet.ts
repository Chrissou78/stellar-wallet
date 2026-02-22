import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export interface WalletAccount {
  id: string;
  name: string;
  publicKey: string;
  encryptedSecret: string;
}

interface WalletState {
  accounts: WalletAccount[];
  activeAccountId: string | null;
  network: "testnet" | "public";
  isUnlocked: boolean;
  _secretKey: string | null;

  createWallet: (name: string, pin: string) => Promise<string>;
  importWallet: (name: string, secretKey: string, pin: string) => Promise<string>;
  switchAccount: (id: string) => void;
  removeAccount: (id: string) => void;
  renameAccount: (id: string, name: string) => void;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
  logout: () => void;
  getSecretKey: () => string | null;
  setNetwork: (n: "testnet" | "public") => void;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Generate keypair via backend to avoid importing stellar-base
async function generateKeypair(): Promise<{ publicKey: string; secretKey: string }> {
  const res = await fetch("https://stellar-wallet.onrender.com/api/v1/keypair/generate");
  if (!res.ok) throw new Error("Failed to generate keypair");
  return res.json();
}

// Validate and derive public key from secret via backend
async function publicKeyFromSecret(secret: string): Promise<string> {
  const res = await fetch("https://stellar-wallet.onrender.com/api/v1/keypair/from-secret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  if (!res.ok) throw new Error("Invalid secret key");
  const data = await res.json();
  return data.publicKey;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,
      network: "testnet",
      isUnlocked: false,
      _secretKey: null,

      createWallet: async (name: string, _pin: string) => {
        const { publicKey, secretKey } = await generateKeypair();

        const storeKey = `secret_${publicKey}`;
        await SecureStore.setItemAsync(storeKey, secretKey);

        // Fund only on testnet
        if (get().network === "testnet") {
          try {
            await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
          } catch {}
}

        const account: WalletAccount = {
          id: generateId(),
          name,
          publicKey,
          encryptedSecret: storeKey,
        };

        set((s) => ({
          accounts: [...s.accounts, account],
          activeAccountId: account.id,
          isUnlocked: true,
          _secretKey: secretKey,
        }));

        return publicKey;
      },

      importWallet: async (name: string, secretKey: string, _pin: string) => {
        const publicKey = await publicKeyFromSecret(secretKey);

        const existing = get().accounts.find((a) => a.publicKey === publicKey);
        if (existing) throw new Error("Wallet already exists");

        const storeKey = `secret_${publicKey}`;
        await SecureStore.setItemAsync(storeKey, secretKey);

        const account: WalletAccount = {
          id: generateId(),
          name,
          publicKey,
          encryptedSecret: storeKey,
        };

        set((s) => ({
          accounts: [...s.accounts, account],
          activeAccountId: account.id,
          isUnlocked: true,
          _secretKey: secretKey,
        }));

        return publicKey;
      },

      switchAccount: (id) => set({ activeAccountId: id, isUnlocked: false, _secretKey: null }),
      removeAccount: (id) =>
        set((s) => {
          const accounts = s.accounts.filter((a) => a.id !== id);
          return {
            accounts,
            activeAccountId: accounts.length > 0 ? accounts[0].id : null,
            isUnlocked: false,
            _secretKey: null,
          };
        }),
      renameAccount: (id, name) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, name } : a)),
        })),

      unlock: async (_pin: string) => {
        const active = get().accounts.find((a) => a.id === get().activeAccountId);
        if (!active) throw new Error("No active account");
        const secret = await SecureStore.getItemAsync(active.encryptedSecret);
        if (!secret) throw new Error("Invalid PIN");
        set({ isUnlocked: true, _secretKey: secret });
      },

      lock: () => set({ isUnlocked: false, _secretKey: null }),
      logout: () => set({ accounts: [], activeAccountId: null, isUnlocked: false, _secretKey: null }),
      getSecretKey: () => get()._secretKey,
      setNetwork: (n) => set({ network: n }),
    }),
    {
      name: "stellar-wallet-mobile",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        network: state.network,
      }),
    }
  )
);