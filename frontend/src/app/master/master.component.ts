import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoomService } from '../services/room.service';
import { WebSocketService } from '../services/websocket.service';
import { AudioService } from '../services/audio.service';
import { AudioPlatformService } from '../services/audio-platform.service';
import { WebRtcService } from '../services/webrtc.service';

@Component({
  selector: 'app-master',
  template: `
    <div class="master-wrap">
      <!-- Background -->
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>

      <!-- ── CREATE ROOM ── -->
      <div *ngIf="!roomCreated" class="center-panel animate-fade-up">
        <div class="glass-card panel">

          <div class="panel-header">
            <div class="panel-icon">👑</div>
            <div>
              <h1 class="panel-title">Modo Anfitrión</h1>
              <p class="panel-subtitle">Crea tu sala de audio sincronizado</p>
            </div>
          </div>

          <form [formGroup]="roomForm" (ngSubmit)="createRoom()">
            <div class="field">
              <label class="field-label">Nombre de la Sala</label>
              <input type="text" formControlName="roomName"
                placeholder="Ej: Fiesta del viernes"
                class="neon-input" autocomplete="off">
            </div>
            <div class="field">
              <label class="field-label">Contraseña <span class="optional">(opcional)</span></label>
              <input type="password" formControlName="password"
                placeholder="Dejar vacío para sala pública"
                class="neon-input">
            </div>
            <button type="submit" class="btn-neon btn-cyan full-btn"
              [disabled]="!roomForm.valid || isCreating">
              {{ isCreating ? '⏳ Creando...' : '✨ Crear Sala' }}
            </button>
          </form>

          <div *ngIf="errorMessage" class="error-banner">⚠ {{ errorMessage }}</div>
        </div>
      </div>

      <!-- ── ROOM DASHBOARD ── -->
      <div *ngIf="roomCreated" class="dashboard animate-fade-up">

        <!-- Top bar -->
        <div class="topbar">
          <div class="room-badge">
            <span class="badge badge-cyan"><span class="badge-dot"></span> EN VIVO</span>
            <span class="room-name">{{ roomName }}</span>
          </div>
          <button class="btn-neon btn-ghost exit-btn" (click)="exitRoom()">← Salir</button>
        </div>

        <!-- Grid -->
        <div class="grid">

          <!-- QR + Info -->
          <div class="glass-card qr-card">
            <p class="section-title">Código de acceso</p>
            <div class="qr-wrap">
              <img [src]="qrCode" alt="QR" class="qr-img">
            </div>
            <div class="room-id-row">
              <span class="room-id-label">ID:</span>
              <span class="room-id-val">{{ roomId }}</span>
            </div>
            <p class="qr-hint">Los receptores escanean este QR para unirse</p>
          </div>

          <!-- Slaves -->
          <div class="glass-card slaves-card">
            <p class="section-title">Receptores conectados</p>
            <div class="slaves-count">
              <span class="count-num">{{ slaves.length }}</span>
              <span class="count-label">en línea</span>
            </div>
            <div class="slaves-list" *ngIf="slaves.length > 0">
              <div class="slave-item" *ngFor="let s of slaves">
                <span class="slave-dot"></span>
                <span class="slave-name">{{ s.name }}</span>
              </div>
            </div>
            <div class="empty-slaves" *ngIf="slaves.length === 0">
              <div class="empty-icon">🎧</div>
              <p>Esperando receptores…</p>
            </div>
          </div>

          <!-- Player -->
          <div class="glass-card player-card">
            <p class="section-title">Reproductor</p>

            <!-- Track info -->
            <div class="track-info">
              <div class="waveform" [class.paused]="!isPlaying">
                <div class="waveform-bar"></div><div class="waveform-bar"></div>
                <div class="waveform-bar"></div><div class="waveform-bar"></div>
                <div class="waveform-bar"></div><div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
              </div>
              <div class="track-meta">
                <p class="track-title">{{ currentTrack.title || 'Sin reproducción' }}</p>
                <p class="track-artist">{{ currentTrack.artist || '—' }}</p>
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

            <!-- Controls -->
            <div class="controls">
              <button class="ctrl-btn" (click)="previousTrack()">⏮</button>
              <button class="ctrl-btn ctrl-play" (click)="togglePlay()">
                {{ isPlaying ? '⏸' : '▶' }}
              </button>
              <button class="ctrl-btn" (click)="nextTrack()">⏭</button>
            </div>

            <!-- Volume -->
            <div class="volume-row">
              <span class="vol-icon">🔈</span>
              <input type="range" min="0" max="100" [(ngModel)]="volume" (change)="setVolume()" style="flex:1">
              <span class="vol-val">{{ volume }}%</span>
            </div>

            <!-- Load audio -->
            <div class="load-section">
              <p class="section-title">Fuente de Audio</p>

              <!-- System Audio (desktop) -->
              <button class="btn-neon btn-cyan full-btn" (click)="captureSystemAudio()" style="margin-bottom:10px">
                {{ isCapturingSystem ? '🔴 Transmitiendo sistema...' : '🖥️ Capturar Audio del Sistema' }}
              </button>
              <p class="hint-text">En PC: comparte el audio de tu sistema operativo (como Bluetooth)</p>

              <div class="divider-row"><span>o</span></div>

              <label class="file-drop">
                <input type="file" accept="audio/*" (change)="onFileSelected($event)" style="display:none">
                <span class="file-icon">📂</span>
                <span class="file-text">{{ currentTrack.title || 'Cargar archivo MP3/audio' }}</span>
              </label>
            </div>

            <audio #audioPlayer id="master-audio"></audio>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .master-wrap {
      position: relative; width: 100%; min-height: 100vh;
      padding: 16px;
      display: flex; flex-direction: column;
      align-items: center;
      overflow-x: hidden;
    }
    .bg-grid {
      position: fixed; inset: 0; z-index: 0;
      background-image: linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px);
      background-size: 50px 50px;
    }
    .bg-glow { position: fixed; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none; }
    .bg-glow-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(0,245,255,0.1), transparent 70%); top: -100px; left: -100px; }
    .bg-glow-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(191,0,255,0.08), transparent 70%); bottom: -100px; right: -100px; }

    /* Create Room Panel */
    .center-panel { position: relative; z-index: 1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .panel { width: 100%; max-width: 460px; padding: 36px; }
    .panel-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .panel-icon { font-size: 2.5rem; }
    .panel-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: #fff; }
    .panel-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }

    .field { margin-bottom: 20px; }
    .field-label { display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.5px; }
    .optional { color: rgba(226,232,240,0.3); font-weight: 400; }
    .full-btn { width: 100%; margin-top: 8px; font-size: 1rem; padding: 16px; }

    .error-banner { background: rgba(255,0,110,0.1); border: 1px solid rgba(255,0,110,0.3); color: #ff6b9d; border-radius: 10px; padding: 12px 16px; margin-top: 16px; font-size: 0.9rem; }

    /* Dashboard */
    .dashboard { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; }
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 4px; margin-bottom: 20px; }
    .room-badge { display: flex; align-items: center; gap: 12px; }
    .room-name { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #fff; }
    .exit-btn { padding: 10px 20px; font-size: 0.85rem; }

    .grid { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 16px; }

    /* QR Card */
    .qr-card { padding: 24px; display: flex; flex-direction: column; align-items: center; }
    .qr-wrap { margin: 16px 0; }
    .qr-img { width: 200px; height: 200px; border-radius: 12px; border: 2px solid rgba(0,245,255,0.3); padding: 8px; background: #fff; }
    .room-id-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .room-id-label { font-size: 0.75rem; color: var(--text-muted); }
    .room-id-val { font-family: var(--font-display); font-size: 0.85rem; color: var(--neon-cyan); letter-spacing: 1px; }
    .qr-hint { font-size: 0.78rem; color: var(--text-muted); text-align: center; }

    /* Slaves Card */
    .slaves-card { padding: 24px; }
    .slaves-count { display: flex; align-items: baseline; gap: 8px; margin: 12px 0 16px; }
    .count-num { font-family: var(--font-display); font-size: 2.5rem; font-weight: 900; color: var(--neon-cyan); line-height: 1; }
    .count-label { font-size: 0.85rem; color: var(--text-muted); }
    .slaves-list { display: flex; flex-direction: column; gap: 8px; }
    .slave-item { display: flex; align-items: center; gap: 10px; background: rgba(0,245,255,0.05); border: 1px solid rgba(0,245,255,0.1); border-radius: 10px; padding: 10px 14px; }
    .slave-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--neon-green); box-shadow: 0 0 8px var(--neon-green); flex-shrink: 0; }
    .slave-name { font-size: 0.85rem; color: var(--text-primary); }
    .empty-slaves { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 0; color: var(--text-muted); font-size: 0.85rem; }
    .empty-icon { font-size: 2rem; }

    /* Player Card */
    .player-card { padding: 24px; grid-column: 3; }

    .track-info { display: flex; align-items: center; gap: 16px; margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; }
    .track-meta { flex: 1; min-width: 0; }
    .track-title { font-size: 0.95rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .track-artist { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

    .progress-area { margin: 16px 0 20px; }
    .time-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; }

    .controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; }
    .ctrl-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 50%; width: 44px; height: 44px; cursor: pointer; font-size: 1.1rem; color: var(--text-primary); transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .ctrl-btn:hover { background: rgba(0,245,255,0.12); border-color: var(--neon-cyan); color: var(--neon-cyan); }
    .ctrl-play { width: 60px; height: 60px; font-size: 1.4rem; background: linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,128,255,0.2)); border-color: rgba(0,245,255,0.5); color: var(--neon-cyan); box-shadow: 0 0 20px rgba(0,245,255,0.2); }
    .ctrl-play:hover { box-shadow: 0 0 35px rgba(0,245,255,0.5); }

    .volume-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .vol-icon { font-size: 1rem; }
    .vol-val { font-size: 0.8rem; color: var(--text-muted); min-width: 36px; text-align: right; }

    .load-section { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }
    .file-drop {
      display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 8px;
      background: rgba(255,255,255,0.03); border: 1px dashed rgba(0,245,255,0.3); border-radius: 12px;
      padding: 16px; cursor: pointer; transition: all 0.3s;
    }
    .file-drop:hover { background: rgba(0,245,255,0.05); border-color: var(--neon-cyan); }
    .file-icon { font-size: 1.3rem; }
    .file-text { font-size: 0.85rem; color: var(--text-muted); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Responsive */
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr 1fr; }
      .player-card { grid-column: 1 / -1; }
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
      .player-card { grid-column: 1; }
      .qr-img { width: 160px; height: 160px; }
      .topbar { flex-wrap: wrap; gap: 10px; }
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

  isPlaying = false;
  volume = 100;
  progressPercent = 0;
  currentTrack = { title: '', artist: '', source: '' };
  currentTimeDisplay = '0:00';
  durationDisplay   = '0:00';
  isCapturingSystem = false;

  private destroy$ = new Subject<void>();
  private audioElement: HTMLAudioElement | null = null;
  private wsConnected = false;
  private syncInterval: any;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private wsService: WebSocketService,
    private audioService: AudioService,
    private platformService: AudioPlatformService,
    private webRtcService: WebRtcService
  ) {
    this.roomForm = this.fb.group({
      roomName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['']
    });
  }

  ngOnInit(): void {
    this.audioElement = this.audioService.initAudio();
    if (this.audioElement) {
      this.audioElement.addEventListener('timeupdate',     () => this.updateProgress());
      this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
      this.audioElement.addEventListener('play',  () => { this.isPlaying = true; });
      this.audioElement.addEventListener('pause', () => { this.isPlaying = false; });
    }
  }

  createRoom(): void {
    if (!this.roomForm.valid) return;
    this.isCreating = true;
    this.errorMessage = '';
    const { roomName, password } = this.roomForm.value;
    this.roomService.createRoom(roomName, password).pipe(takeUntil(this.destroy$)).subscribe({
      next: (r) => {
        this.roomId = r.roomId; this.roomName = r.name; this.qrCode = r.qrCode;
        this.roomCreated = true; this.isCreating = false;
        this.connectWebSocket();
      },
      error: () => { this.errorMessage = 'Error al crear la sala.'; this.isCreating = false; }
    });
  }

  connectWebSocket(): void {
    this.wsService.connect().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (!this.wsConnected) {
          this.wsConnected = true;
          this.wsService.send({ type: 'master:connect', payload: { room_id: this.roomId, device_name: 'Anfitrión' } });
          this.listenToWebSocket();
          this.startSyncInterval();
        }
      }
    });
  }

  listenToWebSocket(): void {
    this.wsService.message$.pipe(takeUntil(this.destroy$)).subscribe((msg: any) => {
      const { type, payload } = msg;
      if (type === 'slaves:updated') { this.slaves = payload.slaves || []; }
      else if (type === 'webrtc:request-connection') { this.webRtcService.connectToSlave(payload.slaveId); }
      else if (type === 'webrtc:answer') { this.webRtcService.handleAnswer(payload.slaveId, payload.answer); }
      else if (type === 'webrtc:ice')    { this.webRtcService.addIceCandidate(payload.slaveId, payload.candidate); }
    });
  }

  startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.audioElement && this.wsService.isConnected()) {
        this.wsService.send({ type: 'master:timeUpdate', payload: { currentTime: this.audioElement.currentTime * 1000, duration: this.audioElement.duration * 1000 } });
      }
    }, 1000);
  }

  togglePlay(): void {
    if (!this.audioElement) return;
    if (this.isPlaying) { this.audioElement.pause(); this.wsService.send({ type: 'master:pause' }); }
    else                { this.audioElement.play();  this.wsService.send({ type: 'master:play'  }); }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.audioElement) {
      this.isCapturingSystem = false;
      this.audioService.loadFile(file);
      this.currentTrack.title = file.name;
      this.webRtcService.captureAudioElement(this.audioElement).then(() => {
        this.slaves.forEach(s => this.webRtcService.connectToSlave(s.id));
      });
      this.broadcastTrackChange();
    }
  }

  async captureSystemAudio(): Promise<void> {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 1 },
        audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 }
      });
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        alert('No se capturó audio. Asegúrate de marcar "Compartir audio del sistema" en el diálogo.');
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        return;
      }
      // Detener video (no lo necesitamos)
      stream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
      const audioStream = new MediaStream(audioTracks);
      this.webRtcService.setSystemAudioStream(audioStream);
      this.slaves.forEach(s => this.webRtcService.connectToSlave(s.id));
      this.isCapturingSystem = true;
      this.currentTrack.title = '🖥️ Audio del sistema';
      this.broadcastTrackChange();
      // Detectar cuando el usuario deja de compartir
      audioTracks[0].onended = () => { this.isCapturingSystem = false; };
    } catch (e: any) {
      if (e.name !== 'NotAllowedError') {
        alert('Error capturando audio del sistema: ' + e.message);
      }
    }
  }

  setVolume(): void {
    this.audioService.setVolume(this.volume);
    this.wsService.send({ type: 'master:volumeChange', payload: { volume: this.volume } });
  }

  previousTrack(): void { this.wsService.send({ type: 'master:previous' }); }
  nextTrack():     void { this.wsService.send({ type: 'master:next'     }); }

  broadcastTrackChange(): void {
    this.wsService.send({ type: 'master:trackChange', payload: { track: this.currentTrack } });
  }

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

  exitRoom(): void {
    this.roomService.closeRoom(this.roomId).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { this.cleanup(); this.modeChange.emit(null); } });
  }

  private cleanup(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.wsService.disconnect();
    this.audioService.destroy();
    this.webRtcService.destroy();
  }

  ngOnDestroy(): void { this.cleanup(); this.destroy$.next(); this.destroy$.complete(); }
}
