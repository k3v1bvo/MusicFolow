import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// Interfaz del plugin nativo
export interface AudioCapturePlugin {
  startCapture(): Promise<{ status: string }>;
  stopCapture(): Promise<{ status: string }>;
  addListener(event: 'audioChunk', callback: (data: { chunk: string; sampleRate: number; channels: number }) => void): Promise<any>;
}

// Registrar el plugin nativo (solo activo en Android APK)
const AudioCapture = registerPlugin<AudioCapturePlugin>('AudioCapture');

@Injectable({ providedIn: 'root' })
export class NativeAudioService {

  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private chunkListener: any = null;

  /** Verdadero cuando corre como APK en Android */
  get isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Captura el audio interno del sistema (APK Android)
   * Devuelve un MediaStream con el audio capturado.
   */
  async captureSystemAudio(): Promise<MediaStream | null> {
    if (!this.isNative) {
      // En web: usar getDisplayMedia (solo desktop Chrome/Edge)
      return this.captureDisplayAudio();
    }

    if (Capacitor.getPlatform() !== 'android') {
      console.warn('[NativeAudio] Solo soportado en Android');
      return null;
    }

    try {
      // Iniciar captura nativa
      await AudioCapture.startCapture();
      console.log('[NativeAudio] Captura de audio interno iniciada');

      // Crear un MediaStream sintético con los chunks de audio PCM que llegan del nativo
      this.audioContext = new AudioContext({ sampleRate: 44100 });
      const dest = this.audioContext.createMediaStreamDestination();
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 0, 2);

      // Buffer circular para los chunks PCM
      let pendingData: Float32Array[] = [];

      // Escuchar chunks de audio del plugin nativo
      this.chunkListener = await AudioCapture.addListener('audioChunk', (data) => {
        const pcmBytes = Uint8Array.from(atob(data.chunk), c => c.charCodeAt(0));
        const pcm16 = new Int16Array(pcmBytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768.0;
        }
        pendingData.push(float32);
      });

      // Alimentar el ScriptProcessor con los datos acumulados
      this.scriptProcessor.onaudioprocess = (e) => {
        const outL = e.outputBuffer.getChannelData(0);
        const outR = e.outputBuffer.getChannelData(1);
        let offset = 0;
        while (pendingData.length > 0 && offset < outL.length) {
          const chunk = pendingData[0];
          const available = Math.min(chunk.length / 2, outL.length - offset);
          for (let i = 0; i < available; i++) {
            outL[offset + i] = chunk[i * 2]     || 0;
            outR[offset + i] = chunk[i * 2 + 1] || 0;
          }
          if (available * 2 >= chunk.length) {
            pendingData.shift();
          } else {
            pendingData[0] = chunk.slice(available * 2);
          }
          offset += available;
        }
      };

      this.scriptProcessor.connect(dest);
      this.audioContext.resume();

      return dest.stream;

    } catch (e: any) {
      console.error('[NativeAudio] Error:', e);
      return null;
    }
  }

  /** Captura audio del sistema en desktop web via getDisplayMedia */
  async captureDisplayAudio(): Promise<MediaStream | null> {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 1 },
        audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 }
      });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        return null;
      }
      stream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
      return new MediaStream(audioTracks);
    } catch (e: any) {
      if (e.name !== 'NotAllowedError') console.error('[NativeAudio]', e);
      return null;
    }
  }

  /** Detiene la captura */
  async stopCapture(): Promise<void> {
    if (this.isNative) {
      await AudioCapture.stopCapture().catch(() => {});
      if (this.chunkListener) { this.chunkListener.remove(); this.chunkListener = null; }
    }
    if (this.scriptProcessor) { this.scriptProcessor.disconnect(); this.scriptProcessor = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
  }
}
