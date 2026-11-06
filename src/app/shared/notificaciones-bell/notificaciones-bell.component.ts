import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Notificacion } from '../../core/models/actividad.model';
import { ActividadService } from '../../core/services/actividad.service';
import { formatQuantity } from '../format.util';

const SEGUNDOS_ENTRE_CONSULTAS = 30;
const MAX_VISIBLES = 5;
const CLAVE_ULTIMA_VISTA = 'pedidos360_ultima_alerta_vista';

const FORMATO_HORA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' });

function leerUltimaVista(): number {
  try {
    return Number(localStorage.getItem(CLAVE_ULTIMA_VISTA)) || 0;
  } catch {
    return 0;
  }
}

function guardarUltimaVista(id: number): void {
  try {
    localStorage.setItem(CLAVE_ULTIMA_VISTA, String(id));
  } catch {
    // Sin almacenamiento local el contador se reinicia al recargar; no afecta el resto.
  }
}

/** Campana con las alertas de stock bajo que procesador-service consume de q.notificaciones. */
@Component({
  selector: 'app-notificaciones-bell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notificaciones-bell.component.html',
})
export class NotificacionesBellComponent {
  private readonly actividadService = inject(ActividadService);

  protected readonly abierta = signal(false);
  protected readonly alertas = signal<Notificacion[]>([]);
  protected readonly error = signal(false);
  private readonly ultimaVista = signal(leerUltimaVista());

  protected readonly visibles = computed(() => this.alertas().slice(0, MAX_VISIBLES));
  protected readonly nuevas = computed(() => this.alertas().filter((a) => a.id > this.ultimaVista()).length);
  protected readonly formatQuantity = formatQuantity;

  constructor() {
    this.consultar();
    const id = window.setInterval(() => this.consultar(), SEGUNDOS_ENTRE_CONSULTAS * 1000);
    inject(DestroyRef).onDestroy(() => window.clearInterval(id));
  }

  protected alternar(): void {
    const abrir = !this.abierta();
    this.abierta.set(abrir);
    if (abrir) {
      this.consultar();
      this.marcarVistas();
    }
  }

  protected cerrar(): void {
    this.abierta.set(false);
  }

  protected esNueva(alerta: Notificacion): boolean {
    return alerta.id > this.ultimaVista();
  }

  protected hora(valor: string): string {
    return valor ? FORMATO_HORA.format(new Date(valor)) : '';
  }

  private consultar(): void {
    this.actividadService.notificaciones().subscribe({
      next: (alertas) => {
        this.alertas.set(alertas);
        this.error.set(false);
      },
      error: () => this.error.set(true),
    });
  }

  private marcarVistas(): void {
    const maxId = Math.max(0, ...this.alertas().map((a) => a.id));
    if (maxId > this.ultimaVista()) {
      // Se deja un instante para que el usuario alcance a ver cuáles eran nuevas.
      window.setTimeout(() => {
        this.ultimaVista.set(maxId);
        guardarUltimaVista(maxId);
      }, 1500);
    }
  }
}
