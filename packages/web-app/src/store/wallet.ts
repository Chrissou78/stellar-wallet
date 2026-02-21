import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateKeypair, keypairFromSecret, fundTestnet } from "../lib/stellar";
import { encryptSecret, decryptSecret } from "../lib/crypto";

export interface WalletAccount {
  id: string;
  name: string;
  publicKey: string;
  encryptedSecret: string;
  createdAt: number;
}

interface WalletState {
  accounts: WalletAccount[];
  activeAccountId: string | null;
  network: "testnet" | "public";
  isUnlocked: boolean;
  _secretKey: string | null;

  // Methods
  getPublicKey: () => string | null;
  activeAccount: () => WalletAccount | null;
  createWallet: (name: string, pin: string) => Promise<string>;
  importWallet: (name: string, secretKey: string, pin: string) => Promise<string>;
  switchAccount: (accountId: string) => void;
  removeAccount: (accountId: string) => void;
  renameAccount: (accountId: string, newName: string) => void;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
  logout: () => void;
  getSecretKey: () => string;
  setNetwork: (n: "testnet" | "public") => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,
      network: "testnet",
      isUnlocked: false,
      _secretKey: null,

      // ─── Derived (as functions, not getters) ────────
      getPublicKey: () => {
        const state = get();
        const active = state.accounts.find((a) => a.id === state.activeAccountId);
        return active?.publicKey ?? null;
      },

      activeAccount: () => {
        const state = get();
        return state.accounts.find((a) => a.id === state.activeAccountId) ?? null;
      },

      // ─── Create ─────────────────────────────────────
      createWallet: async (name, pin) => {
        const { publicKey, secretKey } = generateKeypair();
        const encrypted = await encryptSecret(secretKey, pin);

        const account: WalletAccount = {
          id: generateId(),
          name: name || `Wallet ${get().accounts.length + 1}`,
          publicKey,
          encryptedSecret: encrypted,
          createdAt: Date.now(),
        };

        try {
          await fundTestnet(publicKey);
        } catch {
          // Friendbot may fail
        }

        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: account.id,
          isUnlocked: true,
          _secretKey: secretKey,
        }));

        return publicKey;
      },

      // ─── Import ─────────────────────────────────────
      importWallet: async (name, secretKey, pin) => {
        const { publicKey } = keypairFromSecret(secretKey);

        if (get().accounts.some((a) => a.publicKey === publicKey)) {
          throw new Error("This wallet is already added");
        }

        const encrypted = await encryptSecret(secretKey, pin);

        const account: WalletAccount = {
          id: generateId(),
          name: name || `Imported ${get().accounts.length + 1}`,
          publicKey,
          encryptedSecret: encrypted,
          createdAt: Date.now(),
        };

        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: account.id,
          isUnlocked: true,
          _secretKey: secretKey,
        }));

        return publicKey;
      },

      // ─── Switch ─────────────────────────────────────
      switchAccount: (accountId) => {
        const account = get().accounts.find((a) => a.id === accountId);
        if (!account) throw new Error("Account not found");
        set({
          activeAccountId: accountId,
          isUnlocked: false,
          _secretKey: null,
        });
      },

      // ─── Remove ─────────────────────────────────────
      removeAccount: (accountId) => {
        const { accounts, activeAccountId } = get();
        const remaining = accounts.filter((a) => a.id !== accountId);
        let newActiveId = activeAccountId;
        if (activeAccountId === accountId) {
          newActiveId = remaining.length > 0 ? remaining[0].id : null;
        }
        set({
          accounts: remaining,
          activeAccountId: newActiveId,
          isUnlocked: false,
          _secretKey: null,
        });
      },

      // ─── Rename ─────────────────────────────────────
      renameAccount: (accountId, newName) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, name: newName } : a
          ),
        }));
      },

      // ─── Auth ───────────────────────────────────────
      unlock: async (pin) => {
        const account = get().activeAccount();
        if (!account) throw new Error("No active account");
        const secretKey = await decryptSecret(account.encryptedSecret, pin);
        set({ isUnlocked: true, _secretKey: secretKey });
      },

      lock: () => set({ isUnlocked: false, _secretKey: null }),

      logout: () =>
        set({
          accounts: [],
          activeAccountId: null,
          isUnlocked: false,
          _secretKey: null,
        }),

      getSecretKey: () => {
        const sk = get()._secretKey;
        if (!sk) throw new Error("Wallet is locked");
        return sk;
      },

      setNetwork: (n) => set({ network: n }),
    }),
    {
      name: "stellar-wallet",
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        network: state.network,
      }),
    }
  )
);
