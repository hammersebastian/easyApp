import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

export interface PlatformAdapter {
  isNative: boolean;
  onResume(listener: () => void): () => void;
  onBack(listener: () => void): () => void;
  onDeepLink(listener: (url: string) => void): () => void;
  getOnline(): Promise<boolean>;
  hapticSuccess(): Promise<void>;
}

const canAnimate = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const platformAdapter: PlatformAdapter = {
  isNative: Capacitor.isNativePlatform(),
  onResume(listener) {
    if (!Capacitor.isNativePlatform()) {
      const visibility = () => document.visibilityState === 'visible' && listener();
      document.addEventListener('visibilitychange', visibility);
      return () => document.removeEventListener('visibilitychange', visibility);
    }
    let remove = () => undefined;
    void App.addListener('appStateChange', ({ isActive }) => isActive && listener()).then(
      (handle) => (remove = () => void handle.remove()),
    );
    return () => remove();
  },
  onBack(listener) {
    if (!Capacitor.isNativePlatform()) return () => undefined;
    let remove = () => undefined;
    void App.addListener('backButton', listener).then((handle) => (remove = () => void handle.remove()));
    return () => remove();
  },
  onDeepLink(listener) {
    if (!Capacitor.isNativePlatform()) return () => undefined;
    let remove = () => undefined;
    void App.addListener('appUrlOpen', ({ url }) => listener(url)).then(
      (handle) => (remove = () => void handle.remove()),
    );
    return () => remove();
  },
  async getOnline() {
    if (!Capacitor.isNativePlatform()) return navigator.onLine;
    return (await Network.getStatus()).connected;
  },
  async hapticSuccess() {
    if (Capacitor.isNativePlatform() && canAnimate()) await Haptics.impact({ style: ImpactStyle.Light });
  },
};
