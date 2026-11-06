import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ENV } from '../../core/env';
import { ActividadService } from '../../core/services/actividad.service';
import {
  FichaAlmacenamiento,
  Notificacion,
  RegistroAuditoria,
  TipoEvento,
} from '../../core/models/actividad.model';
import { ToastService } from '../../shared/toast/toast.service';
import { formatQuantity } from '../../shared/format.util';

type Pestana = 'auditoria' | 'notificaciones' | 'fichas';

const ETIQUETA_TIPO: Record<TipoEvento, { texto: string; clase: string }> = {
  PRODUCTO_CREADO: { texto: 'Creado', clase: 'text-bg-success' },
  PRODUCTO_ACTUALIZADO: { texto: 'Actualizado', clase: 'text-bg-primary' },
  PRODUCTO_ELIMINADO: { texto: 'Eliminado', clase: 'text-bg-danger' },
};

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'medium' });

@Component({
  selector: 'app-actividad',
  standalone: true,
  templateUrl: './actividad.component.html',
})
export class ActividadComponent {
  private readonly actividadService = inject(ActividadService);
  private readonly toast = inject(ToastService);

  protected readonly env = ENV;
  protected readonly loading = signal(true);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly pestana = signal<Pestana>('auditoria');

  protected readonly auditoria = signal<RegistroAuditoria[]>([]);
  protected readonly notificaciones = signal<Notificacion[]>([]);
  protected readonly fichas = signal<FichaAlmacenamiento[]>([]);

  protected readonly formatQuantity = formatQuantity;

  constructor() {
    this.cargar();
  }

  protected seleccionar(pestana: Pestana): void {
    this.pestana.set(pestana);
  }

  protected recargar(): void {
    this.cargar();
  }

  protected etiqueta(tipo: TipoEvento) {
    return ETIQUETA_TIPO[tipo] ?? { texto: tipo, clase: 'text-bg-secondary' };
  }

  protected fecha(valor: string): string {
    return valor ? FORMATO_FECHA.format(new Date(valor)) : '—';
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    forkJoin({
      auditoria: this.actividadService.auditoria(),
      notificaciones: this.actividadService.notificaciones(),
      fichas: this.actividadService.fichas(),
    }).subscribe({
      next: ({ auditoria, notificaciones, fichas }) => {
        this.auditoria.set(auditoria);
        this.notificaciones.set(notificaciones);
        this.fichas.set(fichas);
        this.loading.set(false);
      },
      error: (error) => {
        const message = error?.error?.message || 'No se pudo obtener la actividad del sistema.';
        this.errorMsg.set(message);
        this.loading.set(false);
        this.toast.show(message, 'error');
      },
    });
  }
}
