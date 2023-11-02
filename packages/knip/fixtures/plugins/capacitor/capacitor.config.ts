import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.company.name',
  appName: 'name',
  includePlugins: [
    '@capacitor-community/http',
    '@capacitor/app',
    '@capacitor/ios',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
    '@capacitor/storage',
    'cordova-plugin-inappbrowser',
  ],
  plugins: {},
};

export default config;
