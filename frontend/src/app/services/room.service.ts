import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private getApiUrl(): string {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = host === 'localhost' ? ':3000' : '';
    return `${protocol}//${host}${port}/api`;
  }
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) { }

  // Crear una nueva sala
  createRoom(name: string, password?: string): Observable<any> {
    const payload = { name };
    if (password) {
      Object.assign(payload, { password });
    }
    return this.http.post(`${this.apiUrl}/rooms`, payload);
  }

  // Obtener detalles de una sala
  getRoom(roomId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/${roomId}`);
  }

  // Validar acceso a una sala
  validateRoom(roomId: string, password?: string): Observable<any> {
    const params: any = {};
    if (password) {
      params.password = password;
    }
    const queryStr = Object.keys(params).map(k => `${k}=${params[k]}`).join('&');
    const url = queryStr ? `${this.apiUrl}/rooms/${roomId}/validate?${queryStr}` : `${this.apiUrl}/rooms/${roomId}/validate`;
    return this.http.get(url);
  }

  // Cerrar una sala
  closeRoom(roomId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rooms/${roomId}`);
  }
}
