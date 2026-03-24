import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.serpentsurge.app',
  appName: 'Serpent Surge',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  backgroundColor: '#0a0a0a',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
  },
};

export default config;
