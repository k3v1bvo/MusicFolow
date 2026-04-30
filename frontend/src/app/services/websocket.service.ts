import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  private connectionSubject = new Subject<boolean>();
  private wsUrl = `ws://${window.location.hostname}:3000`;

  public message$ = this.messageSubject.asObservable();
  public connection$ = this.connectionSubject.asObservable();

  constructor() { }

  connect(): Observable<any> {
    return new Observable(observer => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        observer.next({ connected: true });
        return;
      }

      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log('[WS] Conectado al servidor');
        this.connectionSubject.next(true);
        observer.next({ connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Mensaje recibido:', data);
          this.messageSubject.next(data);
          observer.next(data);
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.connectionSubject.next(false);
        observer.error(error);
      };

      this.socket.onclose = () => {
        console.log('[WS] Desconectado del servidor');
        this.connectionSubject.next(false);
        this.socket = null;
      };
    });
  }

  send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log('[WS] Mensaje enviado:', message);
    } else {
      console.error('[WS] Socket no está abierto');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Heartbeat para mantener conexión viva
  startHeartbeat(intervalMs: number = 30000): void {
    setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'heartbeat' });
      }
    }, intervalMs);
  }
}
