import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

interface AuthState {
  isLocked: boolean;
  hasPin: boolean;
  biometricsEnabled: boolean;
  biometricsAvailable: boolean;

  checkBiometrics: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  enableBiometrics: (enabled: boolean) => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  initialize: () => Promise<void>;
}

const PIN_KEY = "stellar_wallet_pin";
const BIO_KEY = "stellar_wallet_biometrics";

export const useAuthStore = create<AuthState>()((set, get) => ({
  isLocked: true,
  hasPin: false,
  biometricsEnabled: false,
  biometricsAvailable: false,

  initialize: async () => {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    const bioEnabled = await SecureStore.getItemAsync(BIO_KEY);
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    set({
      hasPin: !!storedPin,
      biometricsEnabled: bioEnabled === "true",
      biometricsAvailable: compatible && enrolled,
      isLocked: !!storedPin, // locked if PIN is set
    });
  },

  checkBiometrics: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    set({ biometricsAvailable: compatible && enrolled });
  },

  setPin: async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    set({ hasPin: true });
  },

  verifyPin: async (pin: string) => {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin === pin;
  },

  enableBiometrics: async (enabled: boolean) => {
    await SecureStore.setItemAsync(BIO_KEY, enabled ? "true" : "false");
    set({ biometricsEnabled: enabled });
  },

  authenticateWithBiometrics: async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Stellar Wallet",
        cancelLabel: "Use PIN",
        disableDeviceFallback: true,
        fallbackLabel: "Use PIN",
      });
      if (result.success) {
        set({ isLocked: false });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
}));