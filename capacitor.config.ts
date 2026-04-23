import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antoninocampanella.scriptora',
  appName: 'Scriptora',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
