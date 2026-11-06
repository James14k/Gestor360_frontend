import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ENV } from '../../core/env';
import { AuthService } from '../../core/auth/auth.service';
import { iniciales } from '../../shared/format.util';

interface Foto {
  src: string;
  titulo: string;
}

const FOTOS: Foto[] = [
  { src: 'img/bodega-patio.jpg', titulo: 'Patio de recepción y despacho' },
  { src: 'img/bodega-andenes-8.jpg', titulo: 'Andenes de despacho' },
];

const SEGUNDOS_POR_FOTO = 6;

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
})
export class InicioComponent {
  protected readonly auth = inject(AuthService);
  protected readonly env = ENV;
  protected readonly fotos = FOTOS;
  protected readonly indice = signal(0);
  protected readonly iniciales = computed(() => iniciales(this.auth.displayName()));

  protected readonly periodo: string;
  protected readonly fechaHoy: string;

  private pausado = false;

  constructor() {
    const hoy = new Date();
    const mes = hoy.toLocaleDateString('es-CL', { month: 'long' });
    this.periodo = `${mes.charAt(0).toUpperCase()}${mes.slice(1)}-${hoy.getFullYear()}`;
    this.fechaHoy = hoy.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    for (const foto of FOTOS) {
      new Image().src = foto.src;
    }
    const id = window.setInterval(() => {
      if (!this.pausado) {
        this.indice.update((i) => (i + 1) % FOTOS.length);
      }
    }, SEGUNDOS_POR_FOTO * 1000);
    inject(DestroyRef).onDestroy(() => window.clearInterval(id));
  }

  protected irA(i: number): void {
    this.indice.set(i);
  }

  protected pausar(valor: boolean): void {
    this.pausado = valor;
  }

  protected logout(): void {
    void this.auth.logout();
  }
}
