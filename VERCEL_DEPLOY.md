# 🚀 Guía: Desplegar MusicFollow en Vercel

**Status**: ✅ Código en GitHub  
**Repository**: https://github.com/k3v1bvo/MusicFolow  
**Next**: Desplegar en Vercel

---

## 📋 Pre-requisitos

- ✅ Código en GitHub (COMPLETADO)
- Cuenta en [Vercel](https://vercel.com) (crear si no tienes)
- Node.js 16+ instalado

---

## 🚀 Método 1: Vercel CLI (Recomendado - MÁS RÁPIDO)

### Paso 1: Instalar Vercel CLI

```powershell
npm install -g vercel
```

### Paso 2: Autenticarse en Vercel

```powershell
vercel login
```

Se abrirá navegador → click en "Verify" → listo

### Paso 3: Deploy desde tu proyecto local

```powershell
cd d:\ProyectosCode\musicFolow
vercel
```

**Responder preguntas:**
```
? Set up and deploy "d:\ProyectosCode\musicFolow"? 
→ Yes

? Which scope do you want to deploy to? 
→ Tu cuenta de usuario

? Link to existing project? 
→ No

? What's your project's name? 
→ musicfollow

? In which directory is your code located? 
→ ./

? Want to modify these settings before deploying? 
→ No
```

✅ **¡Deploy completado!**

Tu URL será algo como: `https://musicfollow-xxxxx.vercel.app`

---

## 🌐 Método 2: Panel Web (Alternativa - MÁS SIMPLE)

### Paso 1: Abre https://vercel.com/dashboard

### Paso 2: Click en "Add New..." → "Project"

### Paso 3: Click en "Import Git Repository"

### Paso 4: Busca y selecciona tu repositorio
```
Buscar: MusicFolow
Seleccionar: k3v1bvo/MusicFolow
```

### Paso 5: Configurar variables de entorno

En "Environment Variables", agrega:

```
NODE_ENV = production
CORS_ORIGIN = https://tu-dominio.vercel.app
```

### Paso 6: Click "Deploy"

Vercel automáticamente:
- ✅ Detectará `vercel.json`
- ✅ Compilará Angular frontend
- ✅ Instalará dependencias backend
- ✅ Desplegará ambos

**Tiempo estimado**: 3-5 minutos

---

## 🔧 Estructura Vercel Esperada

```
musicFolow/
├── vercel.json              ← Configuración (YA EXISTE)
│   ├── builds: Frontend + Backend
│   ├── routes: /api → Backend, / → Frontend
│   └── env: NODE_ENV, CORS_ORIGIN
│
├── backend/
│   ├── server.js           ← Función serverless
│   ├── package.json
│   └── .env                ← Variables (se copian de Vercel)
│
├── frontend/
│   ├── dist/musicfollow/   ← Build estático
│   └── src/
│
└── .gitignore
```

---

## 📡 Rutas Después del Deploy

| Ruta | Destino | Función |
|------|---------|---------|
| `/` | frontend/dist | Landing page |
| `/master` | frontend/dist | Modo Maestro |
| `/slave` | frontend/dist | Modo Esclavo |
| `/api/rooms` | backend/server.js | REST API |
| `/ws` | backend/server.js | WebSocket |

---

## 🔒 Variables de Entorno en Vercel

**En Settings → Environment Variables:**

```env
# Backend
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://musicfollow-xxxx.vercel.app
WEBSOCKET_PORT=3000

# Audio
SUPPORTED_AUDIO_FORMATS=mp3,wav,ogg,m4a,flac,aac
MAX_AUDIO_DURATION=3600000
```

---

## ✅ Verificar Deployment

### 1. Verificar URL Frontend
```
https://musicfollow-xxxx.vercel.app
→ Debería mostrar Landing page
```

### 2. Verificar API Backend
```bash
curl https://musicfollow-xxxx.vercel.app/api/rooms
→ Debería responder JSON (error 400 OK)
```

### 3. Verificar WebSocket
Abre DevTools (F12) → Console
```javascript
const ws = new WebSocket('wss://musicfollow-xxxx.vercel.app');
ws.onopen = () => console.log('✅ WebSocket Connected!');
```

### 4. Prueba Completa
1. Abre en navegador: `https://musicfollow-xxxx.vercel.app`
2. Haz clic en "👑 Ser Maestro"
3. Crea una sala
4. Copia el ID
5. Abre en otra pestaña: `https://musicfollow-xxxx.vercel.app?room=<ID>`
6. Debería conectarse automáticamente ✅

---

## 🐛 Troubleshooting

### Error: "Build failed"
```
Solución:
1. Verifica que package.json existe en backend/ y frontend/
2. Revisa logs: vercel logs
3. Asegúrate que todas las dependencias están listadas
```

### Error: "WebSocket connection failed"
```
Solución:
1. Verifica CORS_ORIGIN variable de entorno
2. Revisa que WSS (WebSocket Secure) esté habilitado
3. Redeployed: vercel --prod
```

### Error: "CORS error en frontend"
```
Solución:
1. Agrega variable CORS_ORIGIN correcta
2. Redeploy backend: vercel --prod
3. Limpia cache del navegador (Ctrl+Shift+Del)
```

### Build toma mucho tiempo
```
Es normal en Vercel (3-5 min)
Factores:
- npm install (primero instala 130+ dependencias)
- Angular compilation (optimización)
- Size limits (check: vercel log --tail)
```

---

## 📊 Monitoreo Después del Deploy

### Ver logs en tiempo real
```bash
vercel logs --tail
```

### Ver analíticos
En dashboard de Vercel → Analytics tab

### Monitorar errores
En dashboard → Deployments → Select → View

---

## 🔄 Actualizar Después de Cambios

Después de hacer cambios en el código:

```bash
# 1. Commit en local
git add .
git commit -m "Nueva feature"

# 2. Push a GitHub
git push

# 3. Vercel redeploy automático
# (Se dispara automáticamente al detectar cambios en GitHub)

# O manual:
cd d:\ProyectosCode\musicFolow
vercel --prod
```

---

## 📈 Escalabilidad en Vercel

**Plan Gratuito:**
- ✅ Hasta 100 GB de data transfer/mes
- ✅ Serverless functions ilimitadas
- ✅ SSL/TLS incluido
- ✅ Dominios personalizados

**Plan Pro ($20/mes):**
- ✅ Mejor rendimiento
- ✅ Priority support
- ✅ Más recursos

**Para MusicFollow:**
- Inicio: Plan gratuito (perfecto)
- Escala: Plan Pro con Database (próximo)

---

## 🎯 Siguientes Pasos

1. **Desplegar en Vercel** ← AHORA
2. Hacer pruebas en producción (múltiples dispositivos)
3. Agregar Database (MongoDB Atlas) 
4. Mejorar QR Scanner (html5-qrcode)
5. Agregar autenticación JWT

---

## 📞 Soporte Vercel

- Docs: https://vercel.com/docs
- Community: https://github.com/vercel/community
- Support: https://vercel.com/support

---

**¡Listo para desplegar! 🚀**

Elige Método 1 (CLI) o Método 2 (Web) y tendrás MusicFollow en la nube en minutos.
