import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoomService } from '../services/room.service';
import { WebSocketService } from '../services/websocket.service';
import { AudioService } from '../services/audio.service';
import { WebRtcService } from '../services/webrtc.service';

@Component({
  selector: 'app-slave',
  template: `
    <div class="slave-wrap">
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>

      <!-- ── JOIN ── -->
      <div *ngIf="!connected" class="center-panel animate-fade-up">
        <div class="glass-card panel">

          <div class="panel-header">
            <div class="panel-icon">🎧</div>
            <div>
              <h1 class="panel-title">Modo Receptor</h1>
              <p class="panel-subtitle">Únete a una sala de audio sincronizado</p>
            </div>
          </div>

          <!-- Join options -->
          <div *ngIf="!showQrScanner && !showManualEntry && !showPasswordInput" class="join-options">
            <button class="btn-neon btn-purple full-btn" (click)="toggleQrScanner()">
              📷 Escanear Código QR
            </button>
            <button class="btn-neon btn-ghost full-btn" (click)="toggleManualEntry()">
              ⌨️ Ingresar ID manualmente
            </button>
          </div>

          <!-- QR Scanner -->
          <div *ngIf="showQrScanner" class="scanner-section">
            <p class="field-label" style="margin-bottom:12px">Apunta la cámara al código QR del anfitrión</p>
            <div id="qr-video" class="qr-viewport"></div>
            <button class="btn-neon btn-ghost full-btn" style="margin-top:12px" (click)="stopQrScanner()">Cancelar</button>
            <p *ngIf="qrError" class="error-banner">{{ qrError }}</p>
          </div>

          <!-- Manual entry -->
          <div *ngIf="showManualEntry" class="field">
            <label class="field-label">ID de la Sala</label>
            <input type="text" [(ngModel)]="manualRoomId" placeholder="Ej: abc12345"
              class="neon-input" (keyup.enter)="joinRoom()">
            <div class="btn-row" style="margin-top:12px">
              <button class="btn-neon btn-purple" style="flex:1" (click)="joinRoom()" [disabled]="isJoining">
                {{ isJoining ? 'Conectando...' : 'Conectar' }}
              </button>
              <button class="btn-neon btn-ghost" (click)="toggleManualEntry()">Cancelar</button>
            </div>
          </div>

          <!-- Password -->
          <div *ngIf="showPasswordInput" class="field">
            <label class="field-label">Esta sala requiere contraseña</label>
            <input type="password" [(ngModel)]="password" placeholder="Contraseña"
              class="neon-input" (keyup.enter)="joinRoom()">
            <div class="btn-row" style="margin-top:12px">
              <button class="btn-neon btn-purple" style="flex:1" (click)="joinRoom()" [disabled]="isJoining">
                {{ isJoining ? 'Conectando...' : '✨ Entrar' }}
              </button>
              <button class="btn-neon btn-ghost" (click)="resetJoin()">Cancelar</button>
            </div>
          </div>

          <div *ngIf="errorMessage" class="error-banner">⚠ {{ errorMessage }}</div>
        </div>
      </div>

      <!-- ── PLAYER ── -->
      <div *ngIf="connected" class="player-view animate-fade-up">

        <!-- Top bar -->
        <div class="topbar">
          <div class="room-badge">
            <span class="badge" [ngClass]="masterConnected ? 'badge-green' : 'badge-pink'">
              <span class="badge-dot"></span>
              {{ masterConnected ? 'CONECTADO' : 'DESCONECTADO' }}
            </span>
            <span class="room-name">{{ roomName }}</span>
          </div>
          <button class="btn-neon btn-ghost exit-btn" (click)="disconnect()">← Salir</button>
        </div>

        <!-- Player Card -->
        <div class="glass-card player-card">

          <!-- Visualizer -->
          <div class="visualizer">
            <div class="viz-rings">
              <div class="viz-ring viz-ring-1" [class.active]="isPlaying"></div>
              <div class="viz-ring viz-ring-2" [class.active]="isPlaying"></div>
              <div class="viz-ring viz-ring-3" [class.active]="isPlaying"></div>
            </div>
            <div class="viz-center">
              <div class="waveform" [class.paused]="!isPlaying">
                <div class="waveform-bar"></div><div class="waveform-bar"></div>
                <div class="waveform-bar"></div><div class="waveform-bar"></div>
                <div class="waveform-bar"></div><div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
              </div>
            </div>
          </div>

          <!-- Track info -->
          <div class="track-info">
            <h2 class="track-title">{{ currentTrack.title || 'Sin reproducción' }}</h2>
            <p class="track-artist">{{ currentTrack.artist || '—' }}</p>
          </div>

          <!-- Status -->
          <div class="sync-status">
            <div class="status-pill" [ngClass]="syncStatus">
              {{ syncStatusText }}
            </div>
          </div>

          <!-- Progress -->
          <div class="progress-area">
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="progressPercent"></div>
            </div>
            <div class="time-row">
              <span>{{ currentTimeDisplay }}</span>
              <span>{{ durationDisplay }}</span>
            </div>
          </div>

          <!-- Playing indicator -->
          <div class="play-state">
            {{ isPlaying ? '▶️ Reproduciendo' : '⏸ Pausado' }}
          </div>

          <!-- Volume -->
          <div class="volume-row">
            <span class="vol-icon">🔈</span>
            <input type="range" min="0" max="100" [(ngModel)]="localVolume" (change)="setLocalVolume()" style="flex:1">
            <span class="vol-val">{{ localVolume }}%</span>
          </div>

          <!-- Info -->
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Maestro</span>
              <span class="info-val">{{ masterDeviceName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Latencia</span>
              <span class="info-val">{{ latency }}ms</span>
            </div>
          </div>
        </div>

        <audio id="slave-audio" autoplay playsinline></audio>
      </div>
    </div>
  `,
  styles: [`
    .slave-wrap {
      position: relative; width: 100%; min-height: 100vh;
      padding: 16px; overflow-x: hidden;
    }
    .bg-grid {
      position: fixed; inset: 0; z-index: 0;
      background-image: linear-gradient(rgba(191,0,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(191,0,255,0.04) 1px, transparent 1px);
      background-size: 50px 50px;
    }
    .bg-glow { position: fixed; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; }
    .bg-glow-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(191,0,255,0.12), transparent 70%); top: -100px; right: -100px; }
    .bg-glow-2 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(255,0,110,0.08), transparent 70%); bottom: -100px; left: -100px; }

    /* Center Panel */
    .center-panel { position: relative; z-index: 1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .panel { width: 100%; max-width: 420px; padding: 36px; }
    .panel-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .panel-icon { font-size: 2.5rem; }
    .panel-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: #fff; }
    .panel-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }

    .join-options { display: flex; flex-direction: column; gap: 12px; }
    .full-btn { width: 100%; }
    .btn-row { display: flex; gap: 10px; }
    .field { margin-bottom: 0; }
    .field-label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 8px; }
    .error-banner { background: rgba(255,0,110,0.1); border: 1px solid rgba(255,0,110,0.3); color: #ff6b9d; border-radius: 10px; padding: 12px 16px; margin-top: 16px; font-size: 0.85rem; }

    /* QR */
    .scanner-section { display: flex; flex-direction: column; align-items: center; }
    .qr-viewport { width: 100%; max-width: 300px; border-radius: 16px; overflow: hidden; border: 2px solid rgba(191,0,255,0.4); box-shadow: 0 0 30px rgba(191,0,255,0.2); min-height: 200px; background: rgba(0,0,0,0.3); }

    /* Player View */
    .player-view { position: relative; z-index: 1; max-width: 480px; margin: 0 auto; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 4px; margin-bottom: 20px; }
    .room-badge { display: flex; align-items: center; gap: 12px; }
    .room-name { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: #fff; }
    .exit-btn { padding: 10px 20px; font-size: 0.85rem; }

    .player-card { padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 24px; }

    /* Visualizer */
    .visualizer { position: relative; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; }
    .viz-rings { position: absolute; inset: 0; }
    .viz-ring {
      position: absolute; border-radius: 50%; border: 1px solid transparent;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      transition: all 0.5s ease;
    }
    .viz-ring-1 { width: 100%; height: 100%; border-color: rgba(191,0,255,0.2); }
    .viz-ring-2 { width: 76%; height: 76%; border-color: rgba(191,0,255,0.15); }
    .viz-ring-3 { width: 52%; height: 52%; border-color: rgba(191,0,255,0.1); }
    .viz-ring.active {
      animation: borderPulse 2s infinite;
    }
    .viz-ring-1.active { animation-delay: 0s; border-color: rgba(191,0,255,0.5); }
    .viz-ring-2.active { animation-delay: 0.3s; }
    .viz-ring-3.active { animation-delay: 0.6s; }
    .viz-center {
      width: 72px; height: 72px; border-radius: 50%;
      background: radial-gradient(circle, rgba(191,0,255,0.2), transparent 70%);
      border: 1px solid rgba(191,0,255,0.4);
      display: flex; align-items: center; justify-content: center;
    }
    .viz-center .waveform-bar { background: var(--neon-purple); box-shadow: 0 0 6px var(--neon-purple); }

    /* Track */
    .track-info { text-align: center; }
    .track-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #fff; }
    .track-artist { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }

    /* Sync status */
    .sync-status { display: flex; justify-content: center; }
    .status-pill { padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; }
    .status-pill.synced    { background: rgba(0,255,136,0.12); color: var(--neon-green); border: 1px solid rgba(0,255,136,0.3); }
    .status-pill.syncing   { background: rgba(255,200,0,0.12); color: #ffc800; border: 1px solid rgba(255,200,0,0.3); animation: neonPulse 1.5s infinite; }
    .status-pill.disconnected { background: rgba(255,0,110,0.12); color: var(--neon-pink); border: 1px solid rgba(255,0,110,0.3); }

    /* Progress */
    .progress-area { width: 100%; }
    .time-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; }

    .play-state { font-size: 0.9rem; color: var(--text-muted); }

    /* Volume */
    .volume-row { display: flex; align-items: center; gap: 12px; width: 100%; }
    .vol-icon { font-size: 1rem; }
    .vol-val { font-size: 0.8rem; color: var(--text-muted); min-width: 36px; text-align: right; }

    /* Info */
    .info-row { display: flex; gap: 20px; width: 100%; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
    .info-item { flex: 1; }
    .info-label { display: block; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-val { font-family: var(--font-display); font-size: 0.9rem; color: var(--neon-purple); }

    @media (max-width: 480px) {
      .player-card { padding: 24px; gap: 18px; }
      .visualizer { width: 130px; height: 130px; }
    }
  `]
})
export class SlaveComponent implements OnInit, OnDestroy {
  @Output() modeChange = new EventEmitter<string | null>();

  connected = false;
  roomId = '';
  roomName = '';
  masterDeviceName = '';
  masterConnected = true;
  password = '';
  isJoining = false;
  errorMessage = '';

  showQrScanner = false;
  showManualEntry = false;
  showPasswordInput = false;
  manualRoomId = '';
  qrError = '';

  isPlaying = false;
  progressPercent = 0;
  currentTrack = { title: '', artist: '', source: '' };
  currentTimeDisplay = '0:00';
  durationDisplay = '0:00';

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
    private audioService: AudioService,
    private webRtcService: WebRtcService
  ) {}

  ngOnInit(): void {
    this.audioElement = this.audioService.initAudio();
    if (this.audioElement) {
      this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
      this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
    }
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('room');
    if (rid) { this.manualRoomId = rid; this.joinRoom(); }
  }

  private qrScanner: any = null;

  toggleQrScanner(): void {
    this.showQrScanner = !this.showQrScanner;
    if (this.showQrScanner) {
      // Esperar a que Angular renderice el div#qr-video antes de iniciar
      setTimeout(() => this.startQrScanner(), 200);
    } else {
      this.stopQrScannerInstance();
    }
  }

  toggleManualEntry(): void { this.showManualEntry = !this.showManualEntry; }

  stopQrScanner(): void {
    this.stopQrScannerInstance();
    this.showQrScanner = false;
  }

  private stopQrScannerInstance(): void {
    if (this.qrScanner) {
      this.qrScanner.stop().catch(() => {});
      this.qrScanner = null;
    }
  }

  startQrScanner(): void {
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const el = document.getElementById('qr-video');
      if (!el) {
        this.qrError = 'Error: contenedor de cámara no encontrado';
        return;
      }
      this.qrScanner = new Html5Qrcode('qr-video');
      this.qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded: string) => {
          try {
            const url = new URL(decoded);
            const rid = url.searchParams.get('room');
            if (rid) {
              this.manualRoomId = rid;
              this.stopQrScannerInstance();
              this.showQrScanner = false;
              this.joinRoom();
            }
          } catch {
            this.manualRoomId = decoded.trim();
            this.stopQrScannerInstance();
            this.showQrScanner = false;
            this.joinRoom();
          }
        },
        () => { /* ignorar errores de frame */ }
      ).catch((e: any) => {
        this.qrError = 'No se pudo acceder a la cámara. Verifica los permisos.';
        console.error('[QR]', e);
      });
    });
  }

  joinRoom(): void {
    if (!this.manualRoomId.trim()) { this.errorMessage = 'Ingresa un código válido'; return; }
    this.isJoining = true; this.errorMessage = '';
    this.roomService.validateRoom(this.manualRoomId, this.password).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r) => {
        if (r.hasPassword && !this.password) { this.showPasswordInput = true; this.isJoining = false; return; }
        this.roomId = r.roomId; this.roomName = r.name; this.masterConnected = r.masterConnected;
        this.currentTrack = r.playbackState?.currentTrack || { title: '', artist: '' };
        this.connectWebSocket();
      },
      error: (e) => {
        if (e.status === 403) this.errorMessage = 'Contraseña incorrecta';
        else if (e.status === 404) this.errorMessage = 'Sala no encontrada';
        else this.errorMessage = 'Error al validar sala';
        this.isJoining = false;
      }
    });
  }

  connectWebSocket(): void {
    this.wsService.connect().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (!this.wsConnected) {
          this.wsConnected = true;
          this.wsService.send({ type: 'slave:connect', payload: { room_id: this.roomId, password: this.password, device_name: navigator.userAgent.substring(0, 30) } });
          this.listenToWebSocket();
          this.startSyncCheck();
        }
      },
      error: () => { this.errorMessage = 'Error conectando al servidor'; this.isJoining = false; }
    });
  }

  listenToWebSocket(): void {
    this.wsService.message$.pipe(takeUntil(this.destroy$)).subscribe((msg: any) => {
      const { type, payload } = msg;
      if (type === 'slave:connected') {
        this.connected = true; this.isJoining = false;
        this.masterDeviceName = payload.room.masterDeviceName || 'Anfitrión';
        this.masterConnected = payload.room.masterConnected;
        this.webRtcService.initAsSlave();
        this.webRtcService.remoteStream$.pipe(takeUntil(this.destroy$)).subscribe((stream: MediaStream) => {
          const el = document.getElementById('slave-audio') as HTMLAudioElement;
          if (el) { el.srcObject = stream; el.play().catch(console.error); }
        });
      } else if (type === 'webrtc:offer') { this.webRtcService.handleOffer(payload.offer); }
        else if (type === 'webrtc:ice')   { this.webRtcService.addSlaveCandidateFromMaster(payload.candidate); }
        else if (type === 'sync:update')  { this.applySyncUpdate(payload); }
        else if (type === 'master:disconnected') { this.masterConnected = false; this.syncStatus = 'disconnected'; this.syncStatusText = '❌ Maestro desconectado'; }
        else if (type === 'room:closed') { this.errorMessage = 'La sala fue cerrada'; this.disconnect(); }
        else if (type === 'error') { this.errorMessage = payload.message; this.isJoining = false; }
    });
  }

  applySyncUpdate(state: any): void {
    if (!this.audioElement) return;
    if (state.isPlaying !== this.isPlaying) {
      if (state.isPlaying) this.audioElement.play().catch(console.error);
      else this.audioElement.pause();
      this.isPlaying = state.isPlaying;
    }
    const diff = Math.abs((this.audioElement.currentTime * 1000) - state.currentTime);
    if (diff > 500) { this.audioElement.currentTime = state.currentTime / 1000; this.syncStatus = 'syncing'; this.syncStatusText = '🔄 Sincronizando...'; }
    if (state.currentTrack) this.currentTrack = state.currentTrack;
    this.lastSyncTime = Date.now();
    this.latency = Math.round(Date.now() - state.lastUpdate);
  }

  startSyncCheck(): void {
    this.syncCheckInterval = setInterval(() => {
      if (!this.masterConnected) { this.syncStatus = 'disconnected'; this.syncStatusText = '❌ Desconectado'; }
      else if (Date.now() - this.lastSyncTime > 5000) { this.syncStatus = 'syncing'; this.syncStatusText = '🔄 Buscando sincronía...'; }
      else { this.syncStatus = 'synced'; this.syncStatusText = '✅ Sincronizado'; }
    }, 1000);
  }

  setLocalVolume(): void { this.audioService.setVolume(this.localVolume); }

  updateProgress(): void {
    if (!this.audioElement) return;
    this.progressPercent = (this.audioElement.currentTime / this.audioElement.duration) * 100 || 0;
    this.currentTimeDisplay = this.formatTime(this.audioElement.currentTime);
  }
  updateDuration(): void {
    if (!this.audioElement) return;
    this.durationDisplay = this.formatTime(this.audioElement.duration);
  }
  formatTime(s: number): string {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  resetJoin(): void { this.showPasswordInput = false; this.password = ''; this.manualRoomId = ''; this.errorMessage = ''; }
  disconnect(): void { this.cleanup(); this.connected = false; this.modeChange.emit(null); }
  private cleanup(): void {
    if (this.syncCheckInterval) clearInterval(this.syncCheckInterval);
    this.stopQrScannerInstance();
    this.wsService.disconnect();
    this.audioService.destroy();
    this.webRtcService.destroy();
  }
  ngOnDestroy(): void { this.cleanup(); this.destroy$.next(); this.destroy$.complete(); }
}
