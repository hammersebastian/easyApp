import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID || 'de.example.lernapp34d',
  appName: process.env.CAPACITOR_APP_NAME || '34d-Lernapp',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#F7FAF4',
      showSpinner: false
    }
  }
};

export default config;
