# 🚀 Guía de Verificación - MusicFollow

## ✅ Estado Actual (29/04/2026)

### Backend
- ✅ Servidor Node.js en puerto 3000
- ✅ WebSocket configurado
- ✅ API REST implementada
- ✅ Gestión de salas en memoria
- ✅ Generación de QR

### Frontend
- ✅ Angular 17 configurado
- ✅ Componentes creados (Landing, Master, Slave)
- ✅ Servicios implementados (WebSocket, Room, Audio)
- ✅ UI con estilos responsivos
- 🔄 Compilando en puerto 4200...

---

## 📋 Verificación de Funcionalidades

### 1️⃣ Acceso a la Aplicación
```
Abre en navegador: http://localhost:4200
Esperado: Pantalla inicial con opciones "👑 Maestro" y "🎧 Esclavo"
```

### 2️⃣ Modo Maestro - Crear Sala
```
1. Haz clic en "👑 Ser Maestro"
2. Ingresa nombre (ej: "TestRoom123")
3. Contraseña (opcional)
4. Haz clic en "✨ Crear Sala"
Esperado:
  - QR generado visible
  - ID de sala mostrado
  - Interfaz del reproductor cargada
  - Lista de esclavos (vacía inicialmente)
```

### 3️⃣ Modo Esclavo - Conectar
```
1. En otro navegador/tab: http://localhost:4200?room=<ROOM_ID>
2. O haz clic en "🎧 Ser Esclavo" y ingresa el room ID
3. Si tiene contraseña, ingrésala
4. Haz clic en "✨ Conectar"
Esperado:
  - Conexión exitosa
  - Nombre de maestro mostrado
  - Estado: "✅ Sincronizado"
  - Aparece en lista de esclavos del maestro
```

### 4️⃣ Reproducción Sincronizada
```
1. Maestro: Carga archivo de audio o URL
2. Maestro: Haz clic en "▶ Reproducir"
3. Esclavo: Audio debe sonar automáticamente
4. Maestro: Pausa → Esclavo debe pausar también
Esperado:
  - Audio sincronizado ±500ms
  - Play/Pause replicado en esclavos
  - Tiempo mostrado similar en ambos
```

### 5️⃣ Controles
```
Maestro:
  - ▶ Play / ⏸ Pause
  - ⏮ Anterior / ⏭ Siguiente
  - Volumen (0-100%)
  - Carga de archivo/URL
  - Progreso visual

Esclavo:
  - Volumen local (no afecta a otros)
  - Indicador de sincronización
  - Info del maestro
  - Estado de conexión
```

### 6️⃣ Múltiples Esclavos
```
1. Abre 3+ navegadores con modo Esclavo
2. Todos se conectan al mismo room
3. Maestro reproduce audio
Esperado:
  - Todos reproducen en sincronía
  - Lista de esclavos se actualiza
  - Sin lag notorio entre dispositivos
```

### 7️⃣ Desconexión
```
Esclavo: Haz clic en "← Desconectar"
Maestro: Cierra sala ("← Salir")
Esperado:
  - Esclavo desaparece de lista del maestro
  - Ambos regresan a pantalla inicial
  - Audio se detiene
```

---

## 🔧 Troubleshooting

### Error: WebSocket no conecta
**Síntoma**: Error en consola sobre conexión WebSocket
**Solución**:
```bash
1. Verifica backend en terminal: "Backend ejecutándose en puerto 3000"
2. Si no, reinicia backend: cd backend && npm start
3. Comprueba firewall/antivirus no bloquee puerto 3000
```

### Error: CORS
**Síntoma**: "Access to XMLHttpRequest blocked by CORS policy"
**Solución**:
```
Backend tiene CORS habilitado correctamente.
Si persiste, reinicia ambos servidores.
```

### Audio no se escucha en esclavo
**Síntoma**: Maestro reproduce, esclavo no tiene audio
**Soluciones**:
```
1. Verifica volumen del navegador/sistema
2. Comprueba que el archivo cargue correctamente
3. Intenta pausa y play nuevamente
4. Revisa consola de DevTools para errores
```

### QR no aparece
**Síntoma**: Sala creada pero sin QR visible
**Solución**:
```
1. Verifica 'qrcode' package instalado (npm list qrcode)
2. Recarga página del navegador
3. Reinicia frontend: Ctrl+C en terminal y npm start
```

### Sincronización lenta (>500ms)
**Síntoma**: Audio sincronizado pero con retraso notorio
**Posibles causas**:
```
- Latencia de red alta
- Dispositivo sobrecargado
- Muchos esclavos conectados (50+)
Soluciones:
  1. Verifica velocidad de red (DevTools → Network)
  2. Reduce número de esclavos
  3. Cierra otras aplicaciones
```

---

## 📊 Métricas Esperadas

| Métrica | Esperado |
|---------|----------|
| Latencia sincronización | < 500ms |
| Tiempo conexión esclavo | < 2s |
| Tiempo creación sala | < 1s |
| Número esclavos simultáneos | 2-50+ |
| Estabilidad (sin reconexión) | > 10 min |
| Uso memoria (backend) | < 100MB |

---

## 🎯 Próximos Pasos

1. ✅ MVP funcional
2. 📱 Agregar QR scanner mejorado (html5-qrcode)
3. 🔐 Encriptación WebSocket (WSS)
4. 📊 Historial de salas
5. 👤 Autenticación de usuarios
6. 🎵 Soporte para playlists
7. 📱 App nativa (React Native)

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12 → Console)
2. Revisa logs del backend (terminal)
3. Verifica ambos servidores estén ejecutándose
4. Reinicia ambos servidores completamente

---

**¡Disfruta MusicFollow! 🎵**
