import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.musicfollow.app',
  appName: 'MusicFollow',
  webDir: 'dist/frontend',
  // El APK se conecta directamente al backend de Render
  // No hace falta servidor local; la app Angular tiene las URLs configuradas dinámicamente
  plugins: {
    // Sin configuración especial de plugins por ahora
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true // quitar en producción final
  }
};

export default config;
