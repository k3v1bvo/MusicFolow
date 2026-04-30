# 🚀 Guía: Subir a GitHub y Vercel

## Paso 1: Inicializar Git Localmente

```bash
cd d:\ProyectosCode\musicFolow

# Inicializar repositorio git
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: MusicFollow MVP - Audio sincronizado multiplataforma"
```

## Paso 2: Conectar con GitHub

```bash
# Agregar remote (reemplaza con tu URL)
git remote add origin https://github.com/k3v1bvo/MusicFolow.git

# Subir al repositorio (rama main)
git branch -M main
git push -u origin main
```

## Paso 3: Preparar para Vercel

### Opción A: Vercel CLI (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Autenticarse en Vercel
vercel login

# Desde la raíz del proyecto
cd d:\ProyectosCode\musicFolow
vercel
```

### Opción B: Panel de Vercel Web

1. Abre https://vercel.com/dashboard
2. Click en "Add New..." → "Project"
3. Selecciona "Import Git Repository"
4. Busca "MusicFolow"
5. Click "Import"
6. Vercel detectará automáticamente `vercel.json`

## Paso 4: Variables de Entorno en Vercel

En el panel de Vercel, agrega estas variables en Settings → Environment Variables:

```
NODE_ENV = production
CORS_ORIGIN = https://tu-dominio-vercel.vercel.app
```

## Paso 5: Verificar Deployment

```bash
# Ver logs de Vercel
vercel logs

# Abrir en navegador
vercel open
```

## 📋 Estructura para Vercel

```
musicFolow/
├── vercel.json           ← Configuración (CREADO)
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example      ← Guía de variables (CREADO)
├── frontend/
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── .env.example      ← Guía de variables (CREADO)
└── .gitignore            ← Configuración git (CREADO)
```

## 🎯 URLs Después del Deploy

- **Frontend**: https://musicfollow-xxxx.vercel.app
- **Backend**: https://musicfollow-xxxx.vercel.app/api
- **WebSocket**: wss://musicfollow-xxxx.vercel.app

## ⚠️ Notas Importantes

1. **WebSocket en Vercel**: Usa WSS (WebSocket Secure) en producción
2. **CORS**: Actualiza `CORS_ORIGIN` con tu dominio de Vercel
3. **Timeouts**: Vercel tiene límites (serverless)
4. **Base de datos**: Para persistencia futura, agregará MongoDB Atlas

## 🐛 Troubleshooting

### Build falla
```bash
# Verificar logs locales
vercel logs --tail
```

### WebSocket no conecta
- Verifica que el backend esté respondiendo en `/api`
- Revisa que CORS_ORIGIN sea correcto

### Frontend no carga
- Verifica que `angular.json` esté en la raíz del frontend
- Comprueba que `dist/musicfollow` existe después del build

---

**Después de hacer push, tu código estará en:**
https://github.com/k3v1bvo/MusicFolow

**Y deployado en:**
https://musicfollow.vercel.app (una vez conectes)
