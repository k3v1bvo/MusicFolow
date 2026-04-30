import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebRtcService {

  remoteStream$ = new Subject<MediaStream>();

  private peerConnections = new Map<string, RTCPeerConnection>(); // slaveId -> pc (usado por master)
  private localStream: MediaStream | null = null;
  private role: 'master' | 'slave' | null = null;
  private slavePC: RTCPeerConnection | null = null; // usado por slave

  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  constructor(private wsService: WebSocketService) {}

  // ─── MASTER ──────────────────────────────────────────────

  /** Captura el stream del elemento <audio> del master */
  async captureAudioElement(audioElement: HTMLAudioElement): Promise<void> {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioElement);
      const dest = ctx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(ctx.destination); // sigue sonando localmente
      this.localStream = dest.stream;
      this.role = 'master';
      console.log('[WebRTC] Audio stream capturado del master');
    } catch (e) {
      console.error('[WebRTC] Error capturando stream:', e);
    }
  }

  /** Inicia conexión WebRTC con un slave dado su ID */
  async connectToSlave(slaveId: string): Promise<void> {
    if (!this.localStream) {
      console.warn('[WebRTC] No hay stream local todavía');
      return;
    }

    const pc = new RTCPeerConnection(this.iceServers);
    this.peerConnections.set(slaveId, pc);

    // Añadir tracks de audio al peer connection
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream!);
    });

    // Enviar candidatos ICE al slave via WebSocket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsService.send({
          type: 'webrtc:ice',
          payload: { slaveId, candidate: event.candidate }
        });
      }
    };

    // Crear offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.wsService.send({
      type: 'webrtc:offer',
      payload: { slaveId, offer }
    });
    console.log(`[WebRTC] Offer enviado a slave ${slaveId}`);
  }

  /** Procesa answer recibido de un slave */
  async handleAnswer(slaveId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(slaveId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`[WebRTC] Answer aplicado de slave ${slaveId}`);
    }
  }

  /** Añade candidato ICE de un slave al peer connection */
  async addIceCandidate(slaveId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(slaveId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // ─── SLAVE ──────────────────────────────────────────────

  /** Inicializa el peer connection del slave y pide conexión al master */
  initAsSlave(): void {
    this.role = 'slave';
    const pc = new RTCPeerConnection(this.iceServers);
    this.slavePC = pc;

    // Cuando llegan tracks de audio del master, emitir el stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Stream recibido del master');
      this.remoteStream$.next(event.streams[0]);
    };

    // Enviar candidatos ICE al master via WebSocket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsService.send({
          type: 'webrtc:ice',
          payload: { candidate: event.candidate }
        });
      }
    };

    // Solicitar al master que inicie la conexión WebRTC
    this.wsService.send({ type: 'webrtc:request-connection', payload: {} });
  }

  /** Procesa offer del master */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.slavePC) return;
    await this.slavePC.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.slavePC.createAnswer();
    await this.slavePC.setLocalDescription(answer);
    this.wsService.send({ type: 'webrtc:answer', payload: { answer } });
    console.log('[WebRTC] Answer enviado al master');
  }

  /** Añade candidato ICE del master */
  async addSlaveCandidateFromMaster(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.slavePC) {
      await this.slavePC.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // ─── CLEANUP ─────────────────────────────────────────────

  destroy(): void {
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    if (this.slavePC) { this.slavePC.close(); this.slavePC = null; }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this.role = null;
  }
}
