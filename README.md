# 🎵 MusicFollow - Audio Sincronizado Multiplataforma

Una aplicación web multiplataforma que permite transmitir audio sincronizado desde un dispositivo maestro a múltiples dispositivos esclavos usando WebSocket, sin necesidad de Bluetooth, solo WiFi y navegador.

## ✨ Características

- **Modo Maestro**: Crea salas, controla reproducción de audio desde cualquier fuente
- **Modo Esclavo**: Únete a salas mediante código QR, reproduce audio sincronizado
- **Sincronización en Tiempo Real**: WebSocket con latencia 100-500ms
- **Multiplataforma**: iOS Safari, Android Chrome, Windows/Mac/Linux browsers
- **Seguridad**: Código QR + contraseña opcional
- **Sin Bluetooth**: Solo WiFi y navegador
- **Escalable**: 2-50+ dispositivos

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn
- Navegador moderno con soporte WebSocket

## 🚀 Instalación

### 1. Backend

```bash
cd backend
npm install
npm start
```

El servidor se ejecutará en `http://localhost:3000`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación se abrirá en `http://localhost:4200`

## 📖 Uso

### Modo Maestro

1. Abre la aplicación en `http://localhost:4200`
2. Selecciona **"👑 Ser Maestro"**
3. Ingresa nombre de la sala (ej: "Fiesta Viernes")
4. Opcionalmente agrega contraseña
5. Haz clic en **"✨ Crear Sala"**
6. Se generará un código QR que los esclavos deben escanear
7. Carga un archivo de audio o URL
8. Usa los controles para reproducir, pausar, cambiar volumen

### Modo Esclavo

1. Abre la aplicación en otro navegador/dispositivo
2. Selecciona **"🎧 Ser Esclavo"**
3. Escanea el código QR del maestro (o ingresa manualmente el ID)
4. Si la sala tiene contraseña, ingrésala
5. El audio del maestro comenzará a reproducirse automáticamente
6. Ajusta el volumen local (no afecta a otros esclavos)

## 🏗️ Estructura del Proyecto

```
musicFolow/
├── backend/
│   ├── server.js              # Servidor principal Express + WebSocket
│   ├── package.json
│   ├── .env                   # Variables de entorno
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts       # Componente raíz
│   │   │   ├── app.module.ts          # Módulo principal
│   │   │   ├── landing/               # Página inicial
│   │   │   ├── master/                # Componente maestro
│   │   │   ├── slave/                 # Componente esclavo
│   │   │   └── services/
│   │   │       ├── websocket.service.ts
│   │   │       ├── room.service.ts
│   │   │       └── audio.service.ts
│   │   ├── main.ts
│   │   └── styles.css
│   ├── package.json
│   ├── angular.json
│   ├── tsconfig.json
│   └── ...
└── README.md
```

## 🔌 API REST Endpoints

### Salas

- `POST /api/rooms` - Crear nueva sala
  - Body: `{ name: string, password?: string }`
  - Response: `{ roomId, name, qrCode, qrUrl }`

- `GET /api/rooms/:roomId` - Obtener detalles de sala
  - Response: `{ roomId, name, masterConnected, slavesCount, slaves, playbackState }`

- `GET /api/rooms/:roomId/validate` - Validar acceso a sala
  - Query: `password?` (opcional)
  - Response: `{ roomId, name, masterConnected, playbackState }`

- `DELETE /api/rooms/:roomId` - Cerrar sala
  - Response: `{ success: true }`

## 🔗 WebSocket Events

### Maestro → Servidor
- `master:connect` - Conectar como maestro
- `master:play` - Iniciar reproducción
- `master:pause` - Pausar reproducción
- `master:seek` - Cambiar posición
- `master:volumeChange` - Cambiar volumen
- `master:trackChange` - Cambiar pista
- `master:timeUpdate` - Actualizar tiempo (sincronización)

### Esclavo → Servidor
- `slave:connect` - Conectar como esclavo
- `heartbeat` - Mantener conexión viva

### Servidor → Esclavos
- `sync:update` - Estado de reproducción sincronizado
- `master:disconnected` - Maestro desconectado
- `room:closed` - Sala cerrada

## 🎯 Verificación

### Local (Desarrollo)

1. **Backend**: Verifica que `http://localhost:3000` responda
2. **Frontend**: Verifica que `http://localhost:4200` cargue
3. **Comunicación**: Abre DevTools → Network tab → filtra por "WS" para ver WebSocket
4. **Creación de sala**: Crea una sala en maestro, debería generar QR
5. **Conexión esclavo**: En otro navegador, escanea QR o ingresa ID manualmente
6. **Sincronización**: Reproduce audio en maestro, verifica que los esclavos reproduzcan

### En Navegadores

- Safari (iOS), Chrome (Android), Firefox/Chrome (Windows/Mac/Linux)
- Responsive design: funciona en mobile y desktop

## 🔒 Seguridad

- Código QR único por sala (requerido para acceso)
- Contraseña opcional para mayor seguridad
- Las salas vacías se limpian automáticamente cada 5 minutos
- Detección de desconexiones automáticas (timeout 60s)

## 🚧 Próximas Fases

- ✅ MVP funcional (fase 1-4)
- 📋 QR Scanner mejorado (html5-qrcode)
- 📊 Historial de salas y estadísticas
- 👤 Autenticación de usuarios
- 🎵 Soporte para playlists
- 📱 App nativa (React Native / Flutter)
- 🔐 Encriptación de conexión (WSS)

## 📝 Notas

- La sincronización máxima es de ±500ms (WebSocket)
- El audio se transmite desde el dispositivo maestro
- Cada esclavo tiene control de volumen local (no afecta a otros)
- Las salas no persisten entre reinicios del servidor (MVP)

## 🐛 Troubleshooting

### WebSocket no conecta
- Verifica que el backend esté ejecutándose en puerto 3000
- Revisa la consola del navegador para errores CORS

### Audio no se sincroniza
- Verifica latencia de red (DevTools → Network)
- Intenta pausar y reproducir nuevamente para forzar sincronización

### QR no carga
- Verifica que `qrcode` package esté instalado (`npm install qrcode`)
- Recarga la página

## 📄 Licencia

MIT

## 👤 Autor

MusicFollow Development Team

---

**¡Disfruta de la música sincronizada! 🎵**
