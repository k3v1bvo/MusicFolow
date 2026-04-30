import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-landing',
  template: `
    <div class="landing-wrap">

      <!-- Animated background grid -->
      <div class="bg-grid"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
      <div class="bg-scanline"></div>

      <div class="landing-content animate-fade-up">

        <!-- Logo -->
        <div class="logo-area">
          <div class="logo-ring animate-float">
            <div class="logo-inner">
              <div class="waveform">
                <div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
                <div class="waveform-bar"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="headline">Music<span class="neon-text">Follow</span></h1>
        <p class="tagline">Streaming de audio sincronizado · Peer to Peer · WiFi</p>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat">
            <span class="stat-val">~50ms</span>
            <span class="stat-label">Latencia</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-val">∞</span>
            <span class="stat-label">Receptores</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-val">P2P</span>
            <span class="stat-label">Sin nube</span>
          </div>
        </div>

        <!-- Role selection -->
        <div class="role-cards">

          <button class="role-card role-master" (click)="selectMaster()">
            <div class="role-icon">👑</div>
            <div class="role-info">
              <h2 class="role-name">Anfitrión</h2>
              <p class="role-desc">Crea una sala, carga música y controla la reproducción</p>
            </div>
            <div class="role-arrow">→</div>
            <div class="role-glow role-glow-master"></div>
          </button>

          <button class="role-card role-slave" (click)="selectSlave()">
            <div class="role-icon">🎧</div>
            <div class="role-info">
              <h2 class="role-name">Receptor</h2>
              <p class="role-desc">Escanea el QR o ingresa el código y recibe el audio en vivo</p>
            </div>
            <div class="role-arrow">→</div>
            <div class="role-glow role-glow-slave"></div>
          </button>

        </div>

        <!-- How it works -->
        <div class="howto glass-card">
          <p class="section-title">¿Cómo funciona?</p>
          <div class="steps">
            <div class="step">
              <div class="step-num">01</div>
              <div class="step-text">El <strong>Anfitrión</strong> crea una sala y se genera un QR</div>
            </div>
            <div class="step">
              <div class="step-num">02</div>
              <div class="step-text">Los <strong>Receptores</strong> escanean el QR para unirse</div>
            </div>
            <div class="step">
              <div class="step-num">03</div>
              <div class="step-text">El Anfitrión carga un audio y el sonido llega a todos en tiempo real</div>
            </div>
          </div>
          <div class="requirement">
            <span class="badge badge-cyan"><span class="badge-dot"></span> WiFi compartido recomendado</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .landing-wrap {
      position: relative;
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      overflow: hidden;
    }

    /* ── Background ── */
    .bg-grid {
      position: fixed; inset: 0; z-index: 0;
      background-image:
        linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px);
      background-size: 50px 50px;
    }
    .bg-glow {
      position: fixed; border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none;
    }
    .bg-glow-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(191,0,255,0.12), transparent 70%);
      top: -150px; right: -150px;
    }
    .bg-glow-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(0,245,255,0.1), transparent 70%);
      bottom: -100px; left: -100px;
    }
    .bg-scanline {
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    }

    /* ── Content ── */
    .landing-content {
      position: relative; z-index: 1;
      width: 100%; max-width: 560px;
      display: flex; flex-direction: column;
      align-items: center; gap: 32px;
    }

    /* ── Logo ── */
    .logo-area { display: flex; flex-direction: column; align-items: center; gap: 20px; }

    .logo-ring {
      width: 100px; height: 100px;
      border-radius: 50%;
      border: 2px solid var(--neon-cyan);
      box-shadow: 0 0 30px rgba(0,245,255,0.4), inset 0 0 20px rgba(0,245,255,0.08);
      display: flex; align-items: center; justify-content: center;
    }
    .logo-inner {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,245,255,0.12), transparent);
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Headline ── */
    .headline {
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 8vw, 4rem);
      font-weight: 900;
      letter-spacing: -1px;
      color: #fff;
      text-align: center;
      line-height: 1;
    }
    .neon-text {
      color: var(--neon-cyan);
      animation: neonPulse 3s infinite;
    }

    .tagline {
      font-size: 0.85rem;
      color: var(--text-muted);
      letter-spacing: 1px;
      text-align: center;
    }

    /* ── Stats ── */
    .stats-row {
      display: flex; align-items: center; gap: 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 50px;
      padding: 14px 30px;
    }
    .stat { text-align: center; }
    .stat-val {
      display: block;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--neon-cyan);
    }
    .stat-label {
      display: block;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .stat-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

    /* ── Role Cards ── */
    .role-cards { width: 100%; display: flex; flex-direction: column; gap: 16px; }

    .role-card {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      border-radius: 20px;
      cursor: pointer;
      border: none;
      text-align: left;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-glow);
    }
    .role-card:hover { transform: translateY(-4px); }

    .role-glow {
      position: absolute; inset: 0; border-radius: 20px;
      opacity: 0; transition: opacity 0.3s;
      pointer-events: none;
    }
    .role-card:hover .role-glow { opacity: 1; }
    .role-glow-master { background: radial-gradient(ellipse at left, rgba(0,245,255,0.1), transparent 70%); }
    .role-glow-slave  { background: radial-gradient(ellipse at left, rgba(191,0,255,0.1), transparent 70%); }

    .role-master { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .role-master:hover { box-shadow: 0 8px 40px rgba(0,245,255,0.2); border-color: rgba(0,245,255,0.5); }

    .role-slave { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .role-slave:hover  { box-shadow: 0 8px 40px rgba(191,0,255,0.2); border-color: rgba(191,0,255,0.5); }

    .role-icon { font-size: 2.2rem; flex-shrink: 0; }
    .role-info { flex: 1; }
    .role-name {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
    }
    .role-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
    .role-arrow { font-size: 1.5rem; color: var(--text-muted); flex-shrink: 0; transition: color 0.3s, transform 0.3s; }
    .role-card:hover .role-arrow { color: var(--neon-cyan); transform: translateX(4px); }
    .role-slave:hover .role-arrow { color: var(--neon-purple); }

    /* ── How to ── */
    .howto { padding: 24px; width: 100%; }

    .steps { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .step { display: flex; align-items: flex-start; gap: 14px; }
    .step-num {
      font-family: var(--font-display);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--neon-cyan);
      min-width: 28px;
      padding-top: 2px;
    }
    .step-text { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
    .step-text strong { color: var(--text-primary); }

    .requirement { display: flex; justify-content: center; }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .landing-content { gap: 24px; }
      .stats-row { padding: 12px 20px; gap: 14px; }
      .role-card { padding: 18px; gap: 14px; }
      .role-icon { font-size: 1.8rem; }
    }
  `]
})
export class LandingComponent {
  @Output() modeChange = new EventEmitter<string>();

  selectMaster(): void { this.modeChange.emit('master'); }
  selectSlave():  void { this.modeChange.emit('slave');  }
}
