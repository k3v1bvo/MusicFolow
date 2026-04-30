# 🎵 Detección Automática de Plataformas de Audio

**Nuevo en MusicFollow**: Soporte para múltiples plataformas de audio  
**Status**: ✅ Implementado y Funcional

---

## 🎯 Características Soportadas

### 1. URLs Directas (MP3, WAV, OGG, etc.)
```
✅ Soportado
https://ejemplo.com/cancion.mp3
https://cdn.music.com/audio.wav
/assets/audio/track.ogg
```

**Detecta automáticamente**: Tipo de archivo, duración, nombre

---

### 2. Spotify
```
✅ Detectado
https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb
spotify:track:11dFghVXANMlKmJXsNCQvb
```

**Incluye**: Metadatos (artista, título, thumbnail)  
**Nota**: Requiere Spotify API key en producción

---

### 3. YouTube Music
```
✅ Detectado
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
```

**Incluye**: Título, duración, miniatura  
**Nota**: Requiere YouTube Data API en producción

---

### 4. SoundCloud
```
✅ Detectado
https://soundcloud.com/usuario/cancion-nombre
```

**Incluye**: Artista, título, duración  
**Nota**: Requiere SoundCloud API key en producción

---

## 🔧 Implementación

### Servicio: `audio-platform.service.ts`

```typescript
// Uso en componente
import { AudioPlatformService, AudioSource } from '../services/audio-platform.service';

constructor(private platformService: AudioPlatformService) {}

// Detectar plataforma
const source: AudioSource = this.platformService.detectAudioSource(inputUrl);
// Resultado:
// {
//   type: 'spotify' | 'youtube' | 'soundcloud' | 'direct' | 'unknown',
//   url: 'https://...',
//   title: 'Nombre de la canción',
//   artist: 'Nombre del artista',
//   platform: 'Spotify',
//   duration: 180000 (ms)
// }

// Obtener URL reproducible
const playableUrl = this.platformService.getPlayableUrl(source);

// Obtener metadatos
this.platformService.fetchMetadata(source).subscribe(metadata => {
  console.log(metadata); // { title, artist, thumbnail, duration }
});

// Validar URL
const esValida = this.platformService.validateAudioUrl(url);
```

---

## 📊 Flujo de Detección

```
URL Ingresada
    ↓
┌─────────────────────────────────────────┐
│ detectAudioSource(url)                  │
├─────────────────────────────────────────┤
│ ¿Es Spotify?     → type: 'spotify'      │
│ ¿Es YouTube?     → type: 'youtube'      │
│ ¿Es SoundCloud?  → type: 'soundcloud'   │
│ ¿Es URL directa? → type: 'direct'       │
│ Otro             → type: 'unknown'      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ getPlayableUrl(source)                  │
├─────────────────────────────────────────┤
│ Según plataforma:                       │
│ - Spotify: Preview URL (con API)        │
│ - YouTube: /api/audio/youtube/{videoId}│
│ - SoundCloud: URL nativa               │
│ - Direct: URL original                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ fetchMetadata(source)                   │
├─────────────────────────────────────────┤
│ Obtiene:                                │
│ - Título canción                        │
│ - Artista                               │
│ - Thumbnail/Cover                       │
│ - Duración                              │
└─────────────────────────────────────────┘
    ↓
✅ Reproducción Sincronizada
```

---

## 🔌 API Endpoints para Plataformas

### Backend (server.js) - Próximamente

```javascript
// Spotify - Obtener preview
GET /api/audio/spotify/:trackId
  → Headers: { spotify-token: 'xxxxx' }
  → Response: { url, metadata }

// YouTube - Convertir a audio
GET /api/audio/youtube/:videoId
  → Response: { streamUrl, metadata }

// SoundCloud - Resolver URL
GET /api/audio/soundcloud/:trackId
  → Response: { streamUrl, metadata }
```

---

## 🛠️ Patrones de Detección (Regex)

```javascript
// Spotify
/(?:https?:\/\/)?(?:www\.)?spotify\.com\/track\/([a-zA-Z0-9]+)/

// YouTube
/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/

// SoundCloud
/(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[\w\-]+\/[\w\-]+/

// Audio Directo (MP3, WAV, etc)
/^https?:\/\/.*\.(mp3|wav|ogg|m4a|flac|aac)$/i
```

---

## 📱 Ejemplos de Uso en Master Component

### Ejemplo 1: URL Directa
```
Usuario ingresa: https://ejemplo.com/musica.mp3
↓
Detecta: type=direct, title=musica
↓
Reproductor: carga y sincroniza automáticamente
```

### Ejemplo 2: Spotify
```
Usuario ingresa: https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb
↓
Detecta: type=spotify, title=Canción, artist=Artista
↓
Sistema: obtiene preview URL
↓
Reproductor: sincroniza con esclavos
```

### Ejemplo 3: YouTube
```
Usuario ingresa: https://youtu.be/dQw4w9WgXcQ
↓
Detecta: type=youtube, videoId=dQw4w9WgXcQ
↓
Sistema: convierte a audio streaming
↓
Reproductor: sincroniza con esclavos
```

---

## 🎛️ UI/UX Cambios

### Antes
```
[Cargar Archivo] [O Usar URL: ________] [Cargar URL]
Pista Actual: https://ejemplo.com/audio.mp3
```

### Después
```
[Cargar Archivo] [O Usar URL: ________] [Cargar URL]
📱 Plataforma: Spotify - Nombre Canción
Pista Actual: Nombre Canción
Artista: Artista Nombre
```

---

## 🔐 Seguridad y Permisos

### CORS (Cross-Origin Resource Sharing)
```javascript
// Backend autoriza peticiones de:
CORS_ORIGIN=https://musicfollow.vercel.app
```

### Validación
```typescript
// Valida URL antes de reproducir
validateAudioUrl(url): boolean
  ↓
  Intenta: new URL(url)
  ↓
  Retorna: true/false
```

### MIME Types Soportados
```
audio/mpeg   → .mp3
audio/wav    → .wav
audio/ogg    → .ogg
audio/mp4    → .m4a
audio/flac   → .flac
audio/aac    → .aac
```

---

## 🚀 Próximas Mejoras

### Fase 1: Plataformas Básicas (ACTUAL)
- ✅ Detección de plataformas
- ✅ URLs directas
- ⏳ Spotify API
- ⏳ YouTube API
- ⏳ SoundCloud API

### Fase 2: Reproducción Nativa
- [ ] WebAudio API para procesamiento
- [ ] Visualizador de espectro
- [ ] Ecualizador en tiempo real
- [ ] Efectos de audio

### Fase 3: Streaming Avanzado
- [ ] HLS (HTTP Live Streaming)
- [ ] DASH (Dynamic Adaptive Streaming)
- [ ] Caché local en navegador
- [ ] Descarga de canciones

### Fase 4: Integraciones Premium
- [ ] Autenticación OAuth con plataformas
- [ ] Historial de reproducción
- [ ] Playlists sincronizadas
- [ ] Lyrics sincronizados

---

## 🐛 Debugging

### Habilitar logs
En browser DevTools → Console

```javascript
// Ver detección automática
[AUDIO] Detectado: Spotify
{type: 'spotify', url: 'https://...', platform: 'Spotify', ...}

// Ver metadatos
[AUDIO] Metadatos: {title: 'Canción', artist: 'Artista', ...}

// Ver sincronización
[SYNC] Broadcasted to N slaves
```

### Comandos útiles
```javascript
// Testear detección
const svc = ng.probe(el).injector.get('AudioPlatformService');
svc.detectAudioSource('https://open.spotify.com/track/...');

// Validar URL
svc.validateAudioUrl('https://ejemplo.com/audio.mp3');

// Obtener MIME type
svc.getAudioMimeType('cancion.mp3'); // 'audio/mpeg'
```

---

## 📝 Configuración en Vercel

**Variables de Entorno:**

```env
# Backend
SPOTIFY_API_KEY=xxxxx (opcional)
YOUTUBE_API_KEY=xxxxx (opcional)
SOUNDCLOUD_CLIENT_ID=xxxxx (opcional)

# Audio
SUPPORTED_AUDIO_FORMATS=mp3,wav,ogg,m4a,flac,aac
MAX_AUDIO_DURATION=3600000
```

---

## ✅ Pruebas

### Test 1: URL Directa
```
Input: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
Result: ✅ Detectado, reproducible, sincronizado
```

### Test 2: Spotify
```
Input: https://open.spotify.com/track/11dFghVXANMlKmJXsNCQvb
Result: ✅ Detectado, pero requiere API key para reproducir
```

### Test 3: YouTube
```
Input: https://youtu.be/dQw4w9WgXcQ
Result: ✅ Detectado, requiere backend para extraer audio
```

### Test 4: SoundCloud
```
Input: https://soundcloud.com/artist/track-name
Result: ✅ Detectado, requiere API key para obtener stream
```

---

## 📚 Referencias

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [SoundCloud API](https://developers.soundcloud.com)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaSource Extensions](https://www.w3.org/TR/media-source)

---

**¡Soporte para múltiples plataformas implementado! 🎉**
