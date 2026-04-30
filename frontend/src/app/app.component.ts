import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-landing *ngIf="!currentMode" (modeChange)="onModeChange($event)"></app-landing>
      <app-master *ngIf="currentMode === 'master'" (modeChange)="onModeChange($event)"></app-master>
      <app-slave *ngIf="currentMode === 'slave'" (modeChange)="onModeChange($event)"></app-slave>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class AppComponent implements OnInit {
  currentMode: string | null = null;

  ngOnInit() {
    // Detectar si hay parámetro room en URL (esclavo)
    const params = new URLSearchParams(window.location.search);
    if (params.has('room')) {
      this.currentMode = 'slave';
    }
  }

  onModeChange(mode: string | null) {
    console.log('[APP] Modo cambiado a:', mode);
    this.currentMode = mode;
  }
}
