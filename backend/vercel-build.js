#!/usr/bin/env node

/**
 * Build script para Vercel
 * Verifica dependencias antes de deployment
 */

console.log('🔍 Verificando dependencias del backend...');

try {
  require('express');
  console.log('✅ Express OK');
  require('ws');
  console.log('✅ WebSocket OK');
  require('qrcode');
  console.log('✅ QRCode OK');
  require('cors');
  console.log('✅ CORS OK');
  require('dotenv');
  console.log('✅ DotEnv OK');
  require('uuid');
  console.log('✅ UUID OK');
  
  console.log('\n✅ Todas las dependencias están disponibles');
  process.exit(0);
} catch (error) {
  console.error('❌ Error en verificación:', error.message);
  process.exit(1);
}
