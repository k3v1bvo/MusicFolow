import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-landing',
  template: `
    <div class="landing-container">
      <div class="landing-content">
        <h1 class="title">🎵 MusicFollow</h1>
        <p class="subtitle">Audio sincronizado multiplataforma</p>
        
        <div class="description">
          <p>Transmite audio desde tu dispositivo a múltiples esclavos en sincronía</p>
          <p>Sin Bluetooth, solo WiFi y navegador</p>
        </div>

        <div class="buttons">
          <button class="btn btn-master" (click)="selectMaster()">
            👑 Ser Maestro (Controlador)
          </button>
          <button class="btn btn-slave" (click)="selectSlave()">
            🎧 Ser Esclavo (Receptor)
          </button>
        </div>

        <div class="info">
          <h3>¿Cómo funciona?</h3>
          <ol>
            <li><strong>Maestro</strong> crea una sala y genera código QR</li>
            <li><strong>Esclavos</strong> escanean QR para unirse</li>
            <li><strong>Maestro</strong> reproduce audio (desde cualquier fuente)</li>
            <li><strong>Esclavos</strong> reproducen en sincronía automáticamente</li>
          </ol>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .landing-content {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .title {
      font-size: 3rem;
      margin-bottom: 10px;
      color: #667eea;
    }

    .subtitle {
      font-size: 1.2rem;
      color: #999;
      margin-bottom: 30px;
    }

    .description {
      margin: 30px 0;
      color: #666;
      line-height: 1.6;
    }

    .description p {
      margin: 10px 0;
    }

    .buttons {
      display: flex;
      gap: 20px;
      margin: 40px 0;
      flex-wrap: wrap;
      justify-content: center;
    }

    .btn {
      padding: 15px 30px;
      font-size: 1rem;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      transition: transform 0.3s, box-shadow 0.3s;
      flex: 1;
      min-width: 200px;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }

    .btn-master {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-slave {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .info {
      text-align: left;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #eee;
      color: #666;
    }

    .info h3 {
      margin-bottom: 20px;
      color: #333;
    }

    .info ol {
      margin-left: 20px;
      line-height: 1.8;
    }

    .info li {
      margin-bottom: 10px;
    }

    @media (max-width: 600px) {
      .landing-content {
        padding: 20px;
      }

      .title {
        font-size: 2rem;
      }

      .buttons {
        flex-direction: column;
      }

      .btn {
        min-width: 100%;
      }
    }
  `]
})
export class LandingComponent {
  @Output() modeChange = new EventEmitter<string>();

  selectMaster(): void {
    this.modeChange.emit('master');
  }

  selectSlave(): void {
    this.modeChange.emit('slave');
  }
}
