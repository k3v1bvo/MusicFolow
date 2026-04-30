import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private playbackStateSubject = new Subject<any>();

  public playbackState$ = this.playbackStateSubject.asObservable();

  constructor() { }

  // Inicializar elemento de audio
  initAudio(containerId?: string): HTMLAudioElement {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.controls = false;
      this.audioElement.crossOrigin = 'anonymous';

      // Listeners para cambios de estado
      this.audioElement.addEventListener('play', () => {
        this.emitPlaybackState('play');
      });

      this.audioElement.addEventListener('pause', () => {
        this.emitPlaybackState('pause');
      });

      this.audioElement.addEventListener('timeupdate', () => {
        this.emitPlaybackState('timeupdate');
      });

      this.audioElement.addEventListener('ended', () => {
        this.emitPlaybackState('ended');
      });

      this.audioElement.addEventListener('durationchange', () => {
        this.emitPlaybackState('durationchange');
      });

      if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
          container.appendChild(this.audioElement);
        }
      }
    }
    return this.audioElement;
  }

  // Establecer fuente de audio (URL o archivo)
  setAudioSource(source: string): void {
    if (this.audioElement) {
      this.audioElement.src = source;
      this.audioElement.load();
    }
  }

  // Cargar archivo de audio local
  loadFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.audioElement && e.target?.result) {
        this.audioElement.src = e.target.result as string;
        this.audioElement.load();
      }
    };
    reader.readAsDataURL(file);
  }

  // Play
  play(): void {
    if (this.audioElement) {
      this.audioElement.play().catch(error => {
        console.error('Error al reproducir:', error);
      });
    }
  }

  // Pause
  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  // Seek
  seek(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time / 1000; // Convertir ms a segundos
    }
  }

  // Establecer volumen (0-100)
  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = volume / 100;
    }
  }

  // Obtener estado actual
  getState(): any {
    if (!this.audioElement) return null;

    return {
      isPlaying: !this.audioElement.paused,
      currentTime: (this.audioElement.currentTime * 1000), // Convertir a ms
      duration: (this.audioElement.duration * 1000),
      volume: Math.round(this.audioElement.volume * 100),
      src: this.audioElement.src
    };
  }

  // Sincronizar tiempo
  syncTime(targetTime: number): void {
    if (this.audioElement) {
      const diff = Math.abs((this.audioElement.currentTime * 1000) - targetTime);
      // Solo sincronizar si hay diferencia > 500ms
      if (diff > 500) {
        this.audioElement.currentTime = targetTime / 1000;
        console.log(`[AUDIO SYNC] Ajustado tiempo: ${targetTime}ms`);
      }
    }
  }

  // Sincronizar estado de reproducción
  syncPlaybackState(state: any): void {
    if (!this.audioElement) return;

    // Cambiar estado de reproducción
    if (state.isPlaying && this.audioElement.paused) {
      this.play();
    } else if (!state.isPlaying && !this.audioElement.paused) {
      this.pause();
    }

    // Sincronizar tiempo
    this.syncTime(state.currentTime);

    // Sincronizar volumen
    if (state.volume !== undefined) {
      this.setVolume(state.volume);
    }
  }

  // Capturar audio del dispositivo (micrófono)
  async captureAudio(): Promise<MediaStream> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return this.mediaStream;
    } catch (error) {
      console.error('Error capturing audio:', error);
      throw error;
    }
  }

  // Obtener contexto de audio
  getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window as any).AudioContext() || new (window as any).webkitAudioContext();
    }
    return this.audioContext as AudioContext;
  }

  // Parar captura de audio
  stopCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  private emitPlaybackState(event: string): void {
    const state = this.getState();
    this.playbackStateSubject.next({ event, state });
  }

  // Limpiar recursos
  destroy(): void {
    this.stopCapture();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
