import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Servicio para detectar y extraer audio de múltiples plataformas
 * Soporta: URLs directas, Spotify, YouTube Music, SoundCloud, etc.
 */

export interface AudioSource {
  type: 'direct' | 'spotify' | 'youtube' | 'soundcloud' | 'file' | 'unknown';
  url: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  duration?: number;
  platform?: string;
}

export interface PlatformMetadata {
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AudioPlatformService {
  
  // Patrones para detectar plataformas
  private patterns = {
    spotify: {
      regex: /(?:https?:\/\/)?(?:www\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/,
      name: 'Spotify'
    },
    youtube: {
      regex: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      name: 'YouTube'
    },
    soundcloud: {
      regex: /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[\w\-]+\/[\w\-]+/,
      name: 'SoundCloud'
    },
    direct: {
      regex: /^https?:\/\/.*\.(mp3|wav|ogg|m4a|flac|aac)$/i,
      name: 'URL Directo'
    }
  };

  constructor(private http: HttpClient) {}

  /**
   * Detecta el tipo de fuente de audio
   */
  detectAudioSource(input: string): AudioSource {
    // Limpiar URL
    const cleanInput = input.trim();

    // Verificar Spotify
    if (this.patterns.spotify.regex.test(cleanInput)) {
      const trackId = cleanInput.match(this.patterns.spotify.regex)?.[1];
      return {
        type: 'spotify',
        url: cleanInput,
        platform: 'Spotify',
        title: 'Cargando...'
      };
    }

    // Verificar YouTube
    if (this.patterns.youtube.regex.test(cleanInput)) {
      const videoId = cleanInput.match(this.patterns.youtube.regex)?.[1];
      return {
        type: 'youtube',
        url: cleanInput,
        platform: 'YouTube Music',
        title: 'Cargando...'
      };
    }

    // Verificar SoundCloud
    if (this.patterns.soundcloud.regex.test(cleanInput)) {
      return {
        type: 'soundcloud',
        url: cleanInput,
        platform: 'SoundCloud',
        title: 'Cargando...'
      };
    }

    // Verificar URL directa de audio
    if (this.patterns.direct.regex.test(cleanInput)) {
      return {
        type: 'direct',
        url: cleanInput,
        platform: 'URL Directo',
        title: this.extractFilename(cleanInput)
      };
    }

    // Default: asumir URL directa o archivo local
    return {
      type: 'unknown',
      url: cleanInput,
      title: this.extractFilename(cleanInput)
    };
  }

  /**
   * Extrae metadatos de diferentes plataformas
   */
  fetchMetadata(source: AudioSource): Observable<PlatformMetadata | null> {
    switch (source.type) {
      case 'spotify':
        return this.fetchSpotifyMetadata(source.url);
      case 'youtube':
        return this.fetchYouTubeMetadata(source.url);
      case 'soundcloud':
        return this.fetchSoundCloudMetadata(source.url);
      case 'direct':
        return this.fetchDirectMetadata(source.url);
      default:
        return from([null]);
    }
  }

  /**
   * Obtiene URL reproducible desde diferentes plataformas
   */
  getPlayableUrl(source: AudioSource): string {
    switch (source.type) {
      case 'spotify':
        // Para Spotify, necesitarías API key
        return this.getSpotifyPreviewUrl(source.url);
      
      case 'youtube':
        // Para YouTube, usa un proxy o embed
        return this.getYouTubeAudioUrl(source.url);
      
      case 'direct':
      default:
        return source.url;
    }
  }

  /**
   * Detecta tipo de archivo por extensión
   */
  getAudioMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || 'mp3';
    const mimeTypes: { [key: string]: string } = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac',
      'aac': 'audio/aac'
    };
    return mimeTypes[ext] || 'audio/mpeg';
  }

  /**
   * Formatea información de plataforma para mostrar
   */
  formatPlatformInfo(source: AudioSource): string {
    if (source.platform) {
      return `📱 ${source.platform}${source.title ? ' - ' + source.title : ''}`;
    }
    return source.title || 'Audio sin identificar';
  }

  /**
   * Valida que una URL sea reproducible
   */
  validateAudioUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ============== MÉTODOS PRIVADOS ==============

  private extractFilename(url: string): string {
    try {
      return decodeURIComponent(url.split('/').pop() || '').split('.')[0];
    } catch {
      return 'Audio';
    }
  }

  private fetchSpotifyMetadata(url: string): Observable<PlatformMetadata | null> {
    // Placeholder - en producción usarías Spotify Web API con OAuth
    return from([{
      title: 'Extracto de Spotify',
      artist: 'Artista Desconocido',
      duration: 180000 // 3 minutos default
    }]);
  }

  private fetchYouTubeMetadata(url: string): Observable<PlatformMetadata | null> {
    // Placeholder - YouTube API requiere key
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    return from([{
      title: 'Video de YouTube',
      artist: 'Canal Desconocido',
      duration: 300000
    }]);
  }

  private fetchSoundCloudMetadata(url: string): Observable<PlatformMetadata | null> {
    // Placeholder - SoundCloud API requiere client ID
    return from([{
      title: 'Track de SoundCloud',
      artist: 'Artista Desconocido',
      duration: 240000
    }]);
  }

  private fetchDirectMetadata(url: string): Observable<PlatformMetadata | null> {
    // Para URLs directas, intenta obtener headers
    const headers = new HttpHeaders().set('Range', 'bytes=0-');
    
    return this.http.head(url, { 
      headers,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => ({
        title: this.extractFilename(url),
        artist: 'Audio Local',
        duration: this.parseDuration(response.headers.get('content-length') || '0')
      })),
      catchError(() => from([null]))
    );
  }

  private getSpotifyPreviewUrl(url: string): string {
    // Spotify proporciona URLs de preview en la API
    // Por ahora retornamos la URL original
    // En producción: usar API de Spotify
    return url;
  }

  private getYouTubeAudioUrl(url: string): string {
    // Para YouTube, necesitarías usar youtube-dl o similar en backend
    // Por ahora retornamos URL para buscar en proxy
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    return videoId ? `/api/audio/youtube/${videoId}` : url;
  }

  private parseDuration(contentLength: string): number {
    // Aproximado: 128 kbps = 16,000 bytes por segundo
    const bytes = parseInt(contentLength, 10);
    return Math.round((bytes / 16000) * 1000);
  }
}
