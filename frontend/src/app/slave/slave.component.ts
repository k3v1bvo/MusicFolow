import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoomService } from '../services/room.service';
import { WebSocketService } from '../services/websocket.service';
import { AudioService } from '../services/audio.service';

@Component({
  selector: 'app-slave',
  template: `
    <div class="slave-container">
      <div *ngIf="!connected" class="join-room-panel">
        <h1>🎧 Modo Esclavo</h1>
        
        <div *ngIf="!showPasswordInput" class="join-options">
          <button class="btn btn-option" (click)="toggleQrScanner()">
            📱 Escanear Código QR
          </button>
          <button class="btn btn-option" (click)="toggleManualEntry()">
            ⌨️ Ingresar Código Manual
          </button>
        </div>

        <div *ngIf="showQrScanner" class="qr-scanner-section">
          <h2>Escanear Código QR</h2>
          <video #qrVideo id="qr-video" style="width: 100%; max-width: 300px; margin: 20px 0; border-radius: 10px;"></video>
          <button class="btn btn-secondary" (click)="stopQrScanner()">Cancelar</button>
          <p *ngIf="qrError" class="error-message">{{ qrError }}</p>
        </div>

        <div *ngIf="showManualEntry" class="manual-entry-section">
          <h2>Ingresar Código de Sala</h2>
          <input 
            type="text" 
            placeholder="Ej: abc12345"
            [(ngModel)]="manualRoomId"
            class="input-field"
            (keyup.enter)="joinRoom()"
          >
          <button class="btn btn-secondary" (click)="toggleManualEntry()">Cancelar</button>
        </div>

        <div *ngIf="showPasswordInput" class="password-section">
          <h2>Contraseña Requerida</h2>
          <p>Esta sala está protegida por contraseña</p>
          <input 
            type="password" 
            placeholder="Ingresa la contraseña"
            [(ngModel)]="password"
            class="input-field"
            (keyup.enter)="joinRoom()"
          >
          <div class="password-buttons">
            <button class="btn btn-primary" (click)="joinRoom()" [disabled]="isJoining">
              {{ isJoining ? 'Conectando...' : '✨ Conectar' }}
            </button>
            <button class="btn btn-secondary" (click)="resetJoin()">Cancelar</button>
          </div>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <div *ngIf="connected" class="player-panel">
        <div class="player-header">
          <h1>🎧 {{ roomName }}</h1>
          <button class="btn btn-secondary" (click)="disconnect()">← Desconectar</button>
        </div>

        <div class="master-info">
          <h3>Maestro: {{ masterDeviceName }}</h3>
          <p *ngIf="masterConnected" class="status-connected">✅ Conectado</p>
          <p *ngIf="!masterConnected" class="status-disconnected">❌ Desconectado</p>
        </div>

        <div class="sync-status">
          <div class="status-indicator" [ngClass]="syncStatus">
            {{ syncStatusText }}
          </div>
        </div>

        <div class="player-section">
          <div class="track-info">
            <h2>{{ currentTrack.title || 'Sin reproducción' }}</h2>
            <p>{{ currentTrack.artist || '-' }}</p>
          </div>

          <div class="player-display">
            <div class="status-display">
              {{ isPlaying ? '▶️ Reproduciendo' : '⏸ Pausado' }}
            </div>

            <div class="progress-bar">
              <div class="progress" [style.width.%]="progressPercent"></div>
            </div>
            <div class="time-display">{{ currentTimeDisplay }} / {{ durationDisplay }}</div>
          </div>

          <div class="volume-control">
            <label>Volumen Local:</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              [(ngModel)]="localVolume"
              (change)="setLocalVolume()"
              class="volume-slider"
            >
            <span>{{ localVolume }}%</span>
          </div>

          <div class="sync-info">
            <p><strong>Latencia:</strong> {{ latency }}ms</p>
            <p><strong>Estado:</strong> {{ connectionStatus }}</p>
          </div>
        </div>

        <audio #audioPlayer autoplay></audio>
      </div>
    </div>
  `,
  styles: [`
    .slave-container {
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .join-room-panel, .player-panel {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      color: #f5576c;
      margin-bottom: 30px;
      text-align: center;
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }

    h3 {
      color: #555;
      margin-bottom: 10px;
    }

    .join-options {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 1rem;
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-option, .btn-primary {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .input-field {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      margin: 15px 0;
      transition: border-color 0.3s;
    }

    .input-field:focus {
      outline: none;
      border-color: #f5576c;
    }

    .qr-scanner-section, .manual-entry-section, .password-section {
      margin: 30px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 10px;
    }

    .password-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .password-buttons button {
      flex: 1;
    }

    .error-message {
      color: #d32f2f;
      background: #ffebee;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: center;
    }

    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }

    .player-header h1 {
      margin: 0;
      flex: 1;
    }

    .master-info {
      background: #f0f7ff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #2196f3;
    }

    .master-info h3 {
      margin: 0 0 10px 0;
    }

    .master-info p {
      margin: 0;
      font-size: 0.9rem;
    }

    .status-connected {
      color: #4caf50;
      font-weight: bold;
    }

    .status-disconnected {
      color: #f5576c;
      font-weight: bold;
    }

    .sync-status {
      text-align: center;
      margin-bottom: 30px;
    }

    .status-indicator {
      display: inline-block;
      padding: 12px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.95rem;
    }

    .status-indicator.synced {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .status-indicator.syncing {
      background: #fff9c4;
      color: #f57f17;
      animation: pulse 1.5s infinite;
    }

    .status-indicator.disconnected {
      background: #ffcdd2;
      color: #c62828;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .player-section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 10px;
    }

    .track-info {
      text-align: center;
      margin-bottom: 30px;
    }

    .track-info h2 {
      margin: 0 0 5px 0;
      font-size: 1.5rem;
      color: #333;
    }

    .track-info p {
      color: #999;
      margin: 0;
    }

    .player-display {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .status-display {
      text-align: center;
      font-size: 1.2rem;
      margin-bottom: 15px;
      color: #f5576c;
      font-weight: bold;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: #ddd;
      border-radius: 3px;
      overflow: hidden;
      margin: 15px 0;
    }

    .progress {
      height: 100%;
      background: linear-gradient(90deg, #f093fb, #f5576c);
      transition: width 0.1s;
    }

    .time-display {
      text-align: center;
      color: #999;
      font-size: 0.9rem;
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

    .sync-info {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 0.9rem;
    }

    .sync-info p {
      margin: 5px 0;
      color: #666;
    }

    @media (max-width: 600px) {
      .join-room-panel, .player-panel {
        padding: 20px;
      }

      .player-header {
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
export class SlaveComponent implements OnInit, OnDestroy {
  @Output() modeChange = new EventEmitter<string | null>();

  // Estado de conexión
  connected = false;
  roomId = '';
  roomName = '';
  masterDeviceName = '';
  masterConnected = true;
  password = '';
  isJoining = false;
  errorMessage = '';

  // Controles de entrada
  showQrScanner = false;
  showManualEntry = false;
  showPasswordInput = false;
  manualRoomId = '';
  qrError = '';

  // Estado de reproducción
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  progressPercent = 0;
  currentTrack = { title: '', artist: '', source: '' };
  currentTimeDisplay = '0:00';
  durationDisplay = '0:00';

  // Control local
  localVolume = 100;
  latency = 0;
  syncStatus = 'synced';
  syncStatusText = '✅ Sincronizado';
  connectionStatus = 'Conectado';

  private destroy$ = new Subject<void>();
  private audioElement: HTMLAudioElement | null = null;
  private wsConnected = false;
  private lastSyncTime = 0;
  private syncCheckInterval: any;

  constructor(
    private roomService: RoomService,
    private wsService: WebSocketService,
    private audioService: AudioService
  ) { }

  ngOnInit(): void {
    this.audioElement = this.audioService.initAudio();
    if (this.audioElement) {
      this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
      this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
    }

    // Detectar roomId en URL
    const params = new URLSearchParams(window.location.search);
    const roomIdFromUrl = params.get('room');
    if (roomIdFromUrl) {
      this.manualRoomId = roomIdFromUrl;
      this.joinRoom();
    }
  }

  toggleQrScanner(): void {
    this.showQrScanner = !this.showQrScanner;
    if (this.showQrScanner) {
      this.startQrScanner();
    }
  }

  toggleManualEntry(): void {
    this.showManualEntry = !this.showManualEntry;
  }

  stopQrScanner(): void {
    this.showQrScanner = false;
  }

  startQrScanner(): void {
    // Implementar QR scanner con html5-qrcode en la próxima fase
    console.log('QR Scanner no implementado aún');
    this.qrError = 'Escaneo de QR en desarrollo. Usa entrada manual por ahora.';
  }

  joinRoom(): void {
    if (!this.manualRoomId.trim()) {
      this.errorMessage = 'Ingresa un código de sala válido';
      return;
    }

    this.isJoining = true;
    this.errorMessage = '';

    this.roomService.validateRoom(this.manualRoomId, this.password).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.hasPassword && !this.password) {
          this.showPasswordInput = true;
          this.isJoining = false;
          return;
        }

        this.roomId = response.roomId;
        this.roomName = response.name;
        this.masterConnected = response.masterConnected;
        this.currentTrack = response.playbackState?.currentTrack || { title: '', artist: '' };

        // Conectar WebSocket
        this.connectWebSocket();
      },
      error: (error) => {
        if (error.status === 403) {
          this.errorMessage = 'Contraseña incorrecta';
          this.password = '';
        } else if (error.status === 404) {
          this.errorMessage = 'Sala no encontrada';
        } else {
          this.errorMessage = 'Error al validar sala. Intenta de nuevo.';
        }
        this.isJoining = false;
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
          // Conectar como esclavo
          this.wsService.send({
            type: 'slave:connect',
            payload: {
              room_id: this.roomId,
              password: this.password,
              device_name: navigator.userAgent.substring(0, 30)
            }
          });

          // Escuchar mensajes
          this.listenToWebSocket();

          // Iniciar chequeo de sincronización
          this.startSyncCheck();
        }
      },
      error: (error) => {
        this.errorMessage = 'Error conectando al servidor';
        this.isJoining = false;
        console.error(error);
      }
    });
  }

  listenToWebSocket(): void {
    this.wsService.message$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((message: any) => {
      const { type, payload } = message;

      if (type === 'slave:connected') {
        this.connected = true;
        this.isJoining = false;
        this.masterDeviceName = payload.room.masterDeviceName || 'Maestro';
        this.masterConnected = payload.room.masterConnected;
        console.log('[SLAVE] Conectado a sala:', payload.roomId);
      }

      else if (type === 'sync:update') {
        this.applySyncUpdate(payload);
      }

      else if (type === 'master:disconnected') {
        this.masterConnected = false;
        this.syncStatus = 'disconnected';
        this.syncStatusText = '❌ Maestro desconectado';
      }

      else if (type === 'room:closed') {
        this.errorMessage = 'La sala fue cerrada';
        this.disconnect();
      }

      else if (type === 'error') {
        this.errorMessage = payload.message;
        this.isJoining = false;
      }
    });
  }

  applySyncUpdate(playbackState: any): void {
    if (!this.audioElement) return;

    // Actualizar estado de reproducción
    if (playbackState.isPlaying !== this.isPlaying) {
      if (playbackState.isPlaying) {
        this.audioElement.play().catch(e => console.error('Error playing:', e));
      } else {
        this.audioElement.pause();
      }
      this.isPlaying = playbackState.isPlaying;
    }

    // Sincronizar tiempo
    const timeDiff = Math.abs((this.audioElement.currentTime * 1000) - playbackState.currentTime);
    if (timeDiff > 500) {
      this.audioElement.currentTime = playbackState.currentTime / 1000;
      this.syncStatus = 'syncing';
      this.syncStatusText = '🔄 Sincronizando...';
    }

    // Actualizar metadatos
    if (playbackState.currentTrack) {
      this.currentTrack = playbackState.currentTrack;
    }

    // Registrar latencia
    this.lastSyncTime = Date.now();
  }

  startSyncCheck(): void {
    this.syncCheckInterval = setInterval(() => {
      if (!this.masterConnected) {
        this.syncStatus = 'disconnected';
        this.syncStatusText = '❌ Desconectado';
      } else if (Date.now() - this.lastSyncTime > 5000) {
        this.syncStatus = 'syncing';
        this.syncStatusText = '🔄 Buscando sincronización...';
      } else {
        this.syncStatus = 'synced';
        this.syncStatusText = '✅ Sincronizado';
      }
    }, 1000);
  }

  setLocalVolume(): void {
    this.audioService.setVolume(this.localVolume);
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

  resetJoin(): void {
    this.showPasswordInput = false;
    this.password = '';
    this.manualRoomId = '';
    this.errorMessage = '';
  }

  disconnect(): void {
    this.cleanup();
    this.connected = false;
    this.modeChange.emit(null);
  }

  private cleanup(): void {
    if (this.syncCheckInterval) clearInterval(this.syncCheckInterval);
    this.wsService.disconnect();
    this.audioService.destroy();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
