const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const qrcode = require('qrcode');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// ============ DATA STRUCTURES ============
// Map de salas: roomId -> RoomState
const rooms = new Map();

class RoomState {
  constructor(roomId, name, password = null) {
    this.roomId = roomId;
    this.name = name;
    this.password = password;
    this.qrCode = null;
    this.masterSocket = null;
    this.masterDeviceName = null;
    this.slaveSockets = new Map(); // slaveId -> { socket, deviceName, connectedAt }
    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 100,
      lastUpdate: Date.now(),
      currentTrack: {
        title: 'Sin reproducción',
        artist: '',
        source: '',
        duration: 0
      }
    };
    this.createdAt = Date.now();
  }

  addSlave(slaveId, socket, deviceName) {
    this.slaveSockets.set(slaveId, {
      socket,
      deviceName: deviceName || `Dispositivo ${this.slaveSockets.size + 1}`,
      connectedAt: Date.now()
    });
  }

  removeSlave(slaveId) {
    this.slaveSockets.delete(slaveId);
  }

  broadcastToSlaves(eventType, data) {
    this.slaveSockets.forEach((slave) => {
      if (slave.socket.readyState === WebSocket.OPEN) {
        slave.socket.send(JSON.stringify({ type: eventType, payload: data }));
      }
    });
  }

  sendToMaster(eventType, data) {
    if (this.masterSocket && this.masterSocket.readyState === WebSocket.OPEN) {
      this.masterSocket.send(JSON.stringify({ type: eventType, payload: data }));
    }
  }

  getSlavesList() {
    const list = [];
    this.slaveSockets.forEach((slave, slaveId) => {
      list.push({
        id: slaveId,
        name: slave.deviceName,
        connectedAt: slave.connectedAt
      });
    });
    return list;
  }
}

// ============ REST ENDPOINTS ============

// Crear sala
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la sala es requerido' });
    }

    const roomId = uuidv4().substring(0, 8);
    const room = new RoomState(roomId, name.trim(), password || null);

    // Generar QR
    const appUrl = process.env.APP_URL || `http://${HOST}:${PORT}`;
    const qrUrl = `${appUrl}/join?room=${roomId}`;
    room.qrCode = await qrcode.toDataURL(qrUrl);

    rooms.set(roomId, room);

    console.log(`[ROOM CREATED] ID: ${roomId}, Name: ${name}, Password: ${password ? 'YES' : 'NO'}`);

    res.json({
      roomId,
      name,
      qrCode: room.qrCode,
      qrUrl
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Error al crear la sala' });
  }
});

// Obtener detalles de sala
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  res.json({
    roomId: room.roomId,
    name: room.name,
    masterConnected: !!room.masterSocket,
    masterDeviceName: room.masterDeviceName,
    slavesCount: room.slaveSockets.size,
    slaves: room.getSlavesList(),
    playbackState: room.playbackState,
    hasPassword: !!room.password
  });
});

// Validar acceso a sala
app.get('/api/rooms/:roomId/validate', (req, res) => {
  const { roomId } = req.params;
  const { password } = req.query;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  // Verificar contraseña si existe
  if (room.password && room.password !== password) {
    return res.status(403).json({ error: 'Contraseña incorrecta' });
  }

  res.json({
    roomId: room.roomId,
    name: room.name,
    masterConnected: !!room.masterSocket,
    playbackState: room.playbackState
  });
});

// Cerrar sala
app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  // Desconectar todos los esclavos
  room.broadcastToSlaves('room:closed', { reason: 'El maestro cerró la sala' });
  room.slaveSockets.forEach((slave) => {
    if (slave.socket.readyState === WebSocket.OPEN) {
      slave.socket.close();
    }
  });

  rooms.delete(roomId);
  console.log(`[ROOM CLOSED] ID: ${roomId}`);

  res.json({ success: true, message: 'Sala cerrada' });
});

// ============ WEBSOCKET EVENTS ============

wss.on('connection', (socket) => {
  let socketRole = null; // 'master' o 'slave'
  let roomId = null;
  let socketId = uuidv4().substring(0, 8);

  console.log(`[WS CONNECTED] Socket ID: ${socketId}`);

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      const { type, payload } = message;

      // ===== MASTER EVENTS =====
      if (type === 'master:connect') {
        const { room_id, device_name } = payload;
        const room = rooms.get(room_id);

        if (!room) {
          socket.send(JSON.stringify({ type: 'error', payload: { message: 'Sala no encontrada' } }));
          return;
        }

        socketRole = 'master';
        roomId = room_id;
        room.masterSocket = socket;
        room.masterDeviceName = device_name || 'Maestro';

        socket.send(JSON.stringify({
          type: 'master:connected',
          payload: {
            roomId,
            slaves: room.getSlavesList(),
            playbackState: room.playbackState
          }
        }));

        console.log(`[MASTER CONNECTED] Room: ${roomId}, Device: ${device_name}`);
      }

      // ===== SLAVE EVENTS =====
      else if (type === 'slave:connect') {
        const { room_id, password, device_name } = payload;
        const room = rooms.get(room_id);

        if (!room) {
          socket.send(JSON.stringify({ type: 'error', payload: { message: 'Sala no encontrada' } }));
          return;
        }

        // Validar contraseña
        if (room.password && room.password !== password) {
          socket.send(JSON.stringify({ type: 'error', payload: { message: 'Contraseña incorrecta' } }));
          return;
        }

        socketRole = 'slave';
        roomId = room_id;
        const slaveId = uuidv4().substring(0, 8);
        room.addSlave(slaveId, socket, device_name);
        socket.slaveId = slaveId; // guardar para señalización WebRTC

        socket.send(JSON.stringify({
          type: 'slave:connected',
          payload: {
            roomId,
            slaveId,
            room: {
              name: room.name,
              masterConnected: !!room.masterSocket,
              masterDeviceName: room.masterDeviceName
            },
            playbackState: room.playbackState
          }
        }));

        // Notificar al maestro que se conectó un esclavo
        room.sendToMaster('slaves:updated', { slaves: room.getSlavesList() });

        console.log(`[SLAVE CONNECTED] Room: ${room_id}, Device: ${device_name}, SlaveID: ${slaveId}`);
      }

      // ===== WEBRTC SIGNALING =====
      else if (type === 'webrtc:request-connection') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'slave') {
          room.sendToMaster('webrtc:request-connection', { slaveId: socket.slaveId });
        }
      }

      else if (type === 'webrtc:offer') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          const { slaveId, offer } = payload;
          const slaveData = room.slaveSockets.get(slaveId);
          if (slaveData && slaveData.socket.readyState === WebSocket.OPEN) {
            slaveData.socket.send(JSON.stringify({ type: 'webrtc:offer', payload: { offer } }));
          }
        }
      }

      else if (type === 'webrtc:answer') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'slave') {
          room.sendToMaster('webrtc:answer', { slaveId: socket.slaveId, answer: payload.answer });
        }
      }

      else if (type === 'webrtc:ice') {
        const room = rooms.get(roomId);
        if (!room) return;
        if (socketRole === 'master') {
          const { slaveId, candidate } = payload;
          const slaveData = room.slaveSockets.get(slaveId);
          if (slaveData && slaveData.socket.readyState === WebSocket.OPEN) {
            slaveData.socket.send(JSON.stringify({ type: 'webrtc:ice', payload: { candidate } }));
          }
        } else if (socketRole === 'slave') {
          room.sendToMaster('webrtc:ice', { slaveId: socket.slaveId, candidate: payload.candidate });
        }
      }

      // ===== PLAYBACK EVENTS (MAESTRO) =====
      else if (type === 'master:play') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          room.playbackState.isPlaying = true;
          room.playbackState.lastUpdate = Date.now();
          room.broadcastToSlaves('sync:update', room.playbackState);
          console.log(`[PLAY] Room: ${roomId}`);
        }
      }

      else if (type === 'master:pause') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          room.playbackState.isPlaying = false;
          room.playbackState.lastUpdate = Date.now();
          room.broadcastToSlaves('sync:update', room.playbackState);
          console.log(`[PAUSE] Room: ${roomId}`);
        }
      }

      else if (type === 'master:seek') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          room.playbackState.currentTime = payload.time;
          room.playbackState.lastUpdate = Date.now();
          room.broadcastToSlaves('sync:update', room.playbackState);
          console.log(`[SEEK] Room: ${roomId}, Time: ${payload.time}ms`);
        }
      }

      else if (type === 'master:volumeChange') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          room.playbackState.volume = payload.volume;
          room.broadcastToSlaves('sync:update', room.playbackState);
        }
      }

      else if (type === 'master:trackChange') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          room.playbackState.currentTrack = payload.track;
          room.playbackState.currentTime = 0;
          room.playbackState.lastUpdate = Date.now();
          room.broadcastToSlaves('sync:update', room.playbackState);
          console.log(`[TRACK CHANGED] Room: ${roomId}, Track: ${payload.track.title}`);
        }
      }

      else if (type === 'master:timeUpdate') {
        const room = rooms.get(roomId);
        if (room && socketRole === 'master') {
          room.playbackState.currentTime = payload.currentTime;
          room.playbackState.duration = payload.duration;
          room.playbackState.lastUpdate = Date.now();
          room.broadcastToSlaves('sync:update', room.playbackState);
        }
      }

      // ===== HEARTBEAT =====
      else if (type === 'heartbeat') {
        socket.send(JSON.stringify({ type: 'heartbeat:ack' }));
      }

    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  socket.on('close', () => {
    if (socketRole && roomId) {
      const room = rooms.get(roomId);
      if (room) {
        if (socketRole === 'master') {
          console.log(`[MASTER DISCONNECTED] Room: ${roomId}`);
          room.masterSocket = null;
          room.masterDeviceName = null;
          // Notificar a esclavos que el maestro se desconectó
          room.broadcastToSlaves('master:disconnected', {});
        } else if (socketRole === 'slave') {
          // Encontrar y remover el esclavo
          let slaveId = null;
          room.slaveSockets.forEach((slave, id) => {
            if (slave.socket === socket) {
              slaveId = id;
            }
          });
          if (slaveId) {
            room.removeSlave(slaveId);
            console.log(`[SLAVE DISCONNECTED] Room: ${roomId}, SlaveID: ${slaveId}`);
            // Notificar al maestro
            room.sendToMaster('slaves:updated', { slaves: room.getSlavesList() });
          }
        }
      }
    }
    console.log(`[WS DISCONNECTED] Socket ID: ${socketId}`);
  });

  socket.on('error', (error) => {
    console.error(`[WS ERROR] Socket ID: ${socketId}`, error);
  });
});

// ============ STATIC FILES ============
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ CLEANUP ============
// Limpiar salas vacías cada 5 minutos
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    if (!room.masterSocket && room.slaveSockets.size === 0 && (now - room.createdAt) > 300000) {
      rooms.delete(roomId);
      console.log(`[ROOM DELETED] ID: ${roomId} (vacía por 5 minutos)`);
    }
  });
}, 300000);

// ============ START SERVER ============
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🎵 MusicFollow Backend Server      ║
║     http://localhost:${PORT}              ║
║     WebSocket: ws://localhost:${PORT}    ║
╚════════════════════════════════════════╝
  `);
});

module.exports = { app, server, wss, rooms };
