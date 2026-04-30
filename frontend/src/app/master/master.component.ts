import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoomService } from '../services/room.service';
import { WebSocketService } from '../services/websocket.service';
import { AudioService } from '../services/audio.service';
import { AudioPlatformService, AudioSource } from '../services/audio-platform.service';

@Component({
  selector: 'app-master',
  template: `
    <div class="master-container">
      <div *ngIf="!roomCreated" class="create-room-panel">
        <h1>👑 Modo Maestro</h1>
        <form [formGroup]="roomForm" (ngSubmit)="createRoom()">
          <div class="form-group">
            <label>Nombre de la Sala:</label>
            <input 
              type="text" 
              formControlName="roomName" 
              placeholder="Ej: Fiesta Viernes"
              class="input-field"
            >
          </div>

          <div class="form-group">
            <label>Contraseña (Opcional):</label>
            <input 
              type="password" 
              formControlName="password" 
              placeholder="Dejar vacío para sala abierta"
              class="input-field"
            >
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="!roomForm.valid || isCreating">
            {{ isCreating ? 'Creando...' : '✨ Crear Sala' }}
          </button>
        </form>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <div *ngIf="roomCreated" class="room-panel">
        <div class="room-header">
          <h1>{{ roomName }}</h1>
          <button class="btn btn-secondary" (click)="exitRoom()">← Salir</button>
        </div>

        <div class="qr-section">
          <h2>Código QR para Esclavos</h2>
          <img [src]="qrCode" alt="QR Code" class="qr-image">
          <p class="room-id">ID: {{ roomId }}</p>
        </div>

        <div class="slaves-section">
          <h3>Esclavos Conectados ({{ slaves.length }})</h3>
          <ul class="slaves-list">
            <li *ngFor="let slave of slaves" class="slave-item">
              🎧 {{ slave.name }}
            </li>
            <li *ngIf="slaves.length === 0" class="no-slaves">
              Esperando esclavos...
            </li>
          </ul>
        </div>

        <div class="player-section">
          <h2>Reproductor</h2>
          
          <div class="file-input-group">
            <label>Cargar Archivo de Audio:</label>
            <input 
              type="file" 
              accept="audio/*" 
              (change)="onFileSelected($event)"
              class="file-input"
            >
          </div>

          <div class="url-input-group">
            <label>O Usar URL:</label>
            <input 
              type="text" 
              placeholder="https://ejemplo.com/audio.mp3"
              [(ngModel)]="audioUrl"
              class="input-field"
            >
            <button (click)="setAudioUrl()" class="btn btn-secondary">Cargar URL</button>
          </div>

          <div class="player-controls">
            <button class="btn btn-control" (click)="togglePlay()">
              {{ isPlaying ? '⏸ Pausar' : '▶ Reproducir' }}
            </button>
            <button class="btn btn-control" (click)="previousTrack()">⏮ Anterior</button>
            <button class="btn btn-control" (click)="nextTrack()">Siguiente ⏭</button>
          </div>

          <div class="volume-control">
            <label>Volumen:</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              [(ngModel)]="volume"
              (change)="setVolume()"
              class="volume-slider"
            >
            <span>{{ volume }}%</span>
          </div>

          <div class="progress-bar">
            <div class="progress" [style.width.%]="progressPercent"></div>
          </div>
          <div class="time-display">{{ currentTimeDisplay }} / {{ durationDisplay }}</div>

          <div class="track-info">
            <p><strong>Pista Actual:</strong> {{ currentTrack.title || 'Sin reproducción' }}</p>
            <p><strong>Artista:</strong> {{ currentTrack.artist || '-' }}</p>
          </div>
        </div>

        <audio #audioPlayer></audio>
      </div>
    </div>
  `,
  styles: [`
    .master-container {
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .create-room-panel, .room-panel {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 800px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      color: #667eea;
      margin-bottom: 30px;
      text-align: center;
    }

    h2 {
      color: #333;
      margin-top: 30px;
      margin-bottom: 20px;
    }

    h3 {
      color: #555;
      margin-bottom: 15px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #666;
      font-weight: bold;
    }

    .input-field {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .input-field:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.1rem;
      padding: 15px;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-control {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      flex: 1;
      padding: 12px;
      font-size: 1rem;
    }

    .error-message {
      color: #d32f2f;
      background: #ffebee;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: center;
    }

    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }

    .room-header h1 {
      margin: 0;
      flex: 1;
    }

    .qr-section {
      text-align: center;
      padding: 30px;
      background: #f5f5f5;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .qr-image {
      max-width: 300px;
      margin: 20px 0;
      border: 3px solid #667eea;
      border-radius: 10px;
      padding: 10px;
      background: white;
    }

    .room-id {
      color: #999;
      margin-top: 15px;
      font-size: 0.9rem;
      font-family: monospace;
    }

    .slaves-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }

    .slaves-list {
      list-style: none;
      padding: 0;
    }

    .slave-item {
      padding: 10px;
      background: white;
      margin-bottom: 10px;
      border-radius: 5px;
      border-left: 4px solid #667eea;
    }

    .no-slaves {
      color: #999;
      text-align: center;
      padding: 20px;
    }

    .player-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 10px;
    }

    .file-input-group, .url-input-group {
      margin-bottom: 20px;
    }

    .file-input {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 8px;
    }

    .player-controls {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }

    .volume-control {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 20px 0;
    }

    .volume-slider {
      flex: 1;
      cursor: pointer;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: #ddd;
      border-radius: 3px;
      overflow: hidden;
      margin: 20px 0;
      cursor: pointer;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.1s;
    }

    .time-display {
      text-align: center;
      color: #999;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }

    .track-info {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .track-info p {
      margin: 5px 0;
      color: #666;
    }

    @media (max-width: 600px) {
      .create-room-panel, .room-panel {
        padding: 20px;
      }

      .player-controls {
        flex-direction: column;
      }

      .btn-control {
        width: 100%;
      }

      .room-header {
        flex-direction: column;
        gap: 15px;
      }

      .volume-control {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class MasterComponent implements OnInit, OnDestroy {
  @Output() modeChange = new EventEmitter<string | null>();

  roomForm: FormGroup;
  roomCreated = false;
  roomId = '';
  roomName = '';
  qrCode = '';
  isCreating = false;
  errorMessage = '';
  slaves: any[] = [];

  audioUrl = '';
  isPlaying = false;
  volume = 100;
  currentTime = 0;
  duration = 0;
  progressPercent = 0;
  currentTrack = { title: '', artist: '', source: '' };

  currentTimeDisplay = '0:00';
  durationDisplay = '0:00';

  private destroy$ = new Subject<void>();
  private audioElement: HTMLAudioElement | null = null;
  private wsConnected = false;
  private syncInterval: any;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private wsService: WebSocketService,
    private audioService: AudioService,
    private platformService: AudioPlatformService
  ) {
    this.roomForm = this.fb.group({
      roomName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.audioElement = this.audioService.initAudio();
    if (this.audioElement) {
      this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
      this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
      this.audioElement.addEventListener('play', () => { this.isPlaying = true; });
      this.audioElement.addEventListener('pause', () => { this.isPlaying = false; });
    }
  }

  createRoom(): void {
    if (!this.roomForm.valid) return;

    this.isCreating = true;
    this.errorMessage = '';

    const { roomName, password } = this.roomForm.value;

    this.roomService.createRoom(roomName, password).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.roomId = response.roomId;
        this.roomName = response.name;
        this.qrCode = response.qrCode;
        this.roomCreated = true;
        this.isCreating = false;

        // Conectar WebSocket
        this.connectWebSocket();
      },
      error: (error) => {
        this.errorMessage = 'Error al crear la sala. Intenta de nuevo.';
        this.isCreating = false;
        console.error(error);
      }
    });
  }

  connectWebSocket(): void {
    this.wsService.connect().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        if (!this.wsConnected) {
          this.wsConnected = true;
          // Conectar como maestro
          this.wsService.send({
            type: 'master:connect',
            payload: {
              room_id: this.roomId,
              device_name: 'Maestro Principal'
            }
          });

          // Escuchar mensajes
          this.listenToWebSocket();

          // Iniciar sincronización
          this.startSyncInterval();
        }
      },
      error: (error) => {
        console.error('Error conectando WebSocket:', error);
      }
    });
  }

  listenToWebSocket(): void {
    this.wsService.message$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: any) => {
      const { type, payload } = message;

      if (type === 'slaves:updated') {
        this.slaves = payload.slaves || [];
      } else if (type === 'error') {
        console.error('Error del servidor:', payload.message);
      }
    });
  }

  startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.audioElement && this.wsService.isConnected()) {
        this.wsService.send({
          type: 'master:timeUpdate',
          payload: {
            currentTime: this.audioElement.currentTime * 1000,
            duration: this.audioElement.duration * 1000
          }
        });
      }
    }, 1000);
  }

  togglePlay(): void {
    if (!this.audioElement) return;

    if (this.isPlaying) {
      this.audioElement.pause();
      this.wsService.send({ type: 'master:pause' });
    } else {
      this.audioElement.play();
      this.wsService.send({ type: 'master:play' });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.audioService.loadFile(file);
      this.currentTrack.title = file.name;
      this.broadcastTrackChange();
    }
  }

  setAudioUrl(): void {
    if (!this.audioUrl) return;

    // Detectar plataforma de audio automáticamente
    const audioSource = this.platformService.detectAudioSource(this.audioUrl);
    
    console.log(`[AUDIO] Detectado: ${audioSource.platform || 'URL Directo'}`, audioSource);

    // Obtener URL reproducible
    const playableUrl = this.platformService.getPlayableUrl(audioSource);

    if (playableUrl) {
      this.audioService.setAudioSource(playableUrl);
      
      // Mostrar información de la plataforma
      this.currentTrack.title = audioSource.title || this.platformService.formatPlatformInfo(audioSource);
      this.currentTrack.artist = audioSource.artist || (audioSource.platform || 'Audio');
      this.currentTrack.source = this.audioUrl;

      // Obtener metadatos si están disponibles
      this.platformService.fetchMetadata(audioSource).subscribe({
        next: (metadata) => {
          if (metadata) {
            this.currentTrack.title = metadata.title;
            this.currentTrack.artist = metadata.artist;
          }
          this.broadcastTrackChange();
        },
        error: () => this.broadcastTrackChange()
      });
    } else {
      console.error('[AUDIO] No se pudo obtener URL reproducible');
    }
  }

  setVolume(): void {
    this.audioService.setVolume(this.volume);
    this.wsService.send({
      type: 'master:volumeChange',
      payload: { volume: this.volume }
    });
  }

  previousTrack(): void {
    this.wsService.send({ type: 'master:previous' });
  }

  nextTrack(): void {
    this.wsService.send({ type: 'master:next' });
  }

  broadcastTrackChange(): void {
    this.wsService.send({
      type: 'master:trackChange',
      payload: {
        track: this.currentTrack
      }
    });
  }

  updateProgress(): void {
    if (!this.audioElement) return;
    this.currentTime = this.audioElement.currentTime * 1000;
    this.progressPercent = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    this.currentTimeDisplay = this.formatTime(this.audioElement.currentTime);
  }

  updateDuration(): void {
    if (!this.audioElement) return;
    this.duration = this.audioElement.duration * 1000;
    this.durationDisplay = this.formatTime(this.audioElement.duration);
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  exitRoom(): void {
    this.roomService.closeRoom(this.roomId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.cleanup();
        this.modeChange.emit(null);
      }
    });
  }

  private cleanup(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.wsService.disconnect();
    this.audioService.destroy();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
