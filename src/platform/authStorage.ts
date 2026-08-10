import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import type { SupportedStorage } from '@supabase/supabase-js';

const nativeStorage: SupportedStorage = {
  async getItem(key) {
    try {
      return (await SecureStoragePlugin.get({ key })).value;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    await SecureStoragePlugin.set({ key, value });
  },
  async removeItem(key) {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch {
      // Removing an absent key is already the desired state.
    }
  },
};

const browserStorage: SupportedStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

export const authStorage = Capacitor.isNativePlatform() ? nativeStorage : browserStorage;
