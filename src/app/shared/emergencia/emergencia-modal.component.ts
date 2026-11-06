import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TipoEmergencia } from '../../core/models/actividad.model';
import { EmergenciaResponse } from '../../core/models/emergencia.model';
import { ProductoSuspel } from '../../core/models/producto.model';
import { EmergenciaService } from '../../core/services/emergencia.service';
import { ProductoService } from '../../core/services/producto.service';
import { BODEGAS } from '../bodegas.util';
import { formatQuantity } from '../format.util';
import { RomboImoComponent } from '../rombo-imo/rombo-imo.component';

interface OpcionTipo {
  tipo: TipoEmergencia;
  etiqueta: string;
  icono: string;
}

export const TIPOS_EMERGENCIA: readonly OpcionTipo[] = [
  { tipo: 'INCENDIO', etiqueta: 'Incendio', icono: 'fire' },
  { tipo: 'FUGA_GAS', etiqueta: 'Fuga de gas', icono: 'cloud-haze2' },
  { tipo: 'DERRAME', etiqueta: 'Derrame', icono: 'droplet-half' },
];

@Component({
  selector: 'app-emergencia-modal',
  standalone: true,
  imports: [FormsModule, RouterLink, RomboImoComponent],
  templateUrl: './emergencia-modal.component.html',
})
export class EmergenciaModalComponent {
  private readonly emergenciaService = inject(EmergenciaService);
  private readonly productoService = inject(ProductoService);

  readonly cerrar = output<void>();

  protected readonly bodegas = BODEGAS;
  protected readonly tipos = TIPOS_EMERGENCIA;
  protected readonly formatQuantity = formatQuantity;

  protected readonly bodega = signal<string | null>(null);
  protected readonly tipo = signal<TipoEmergencia | null>(null);
  protected readonly detalle = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resultado = signal<EmergenciaResponse | null>(null);

  private readonly productos = signal<ProductoSuspel[]>([]);
  protected readonly cargandoProductos = signal(true);

  protected readonly sustancias = computed(() => {
    const bodega = this.bodega();
    return bodega ? this.productos().filter((p) => p.bodega === bodega) : [];
  });

  protected readonly puedeEnviar = computed(() => !!this.bodega() && !!this.tipo() && !this.enviando());

  constructor() {
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargandoProductos.set(false);
      },
      error: () => this.cargandoProductos.set(false),
    });
  }

  protected etiquetaTipo(tipo: TipoEmergencia): string {
    return TIPOS_EMERGENCIA.find((t) => t.tipo === tipo)?.etiqueta ?? tipo;
  }

  protected enviar(): void {
    const bodega = this.bodega();
    const tipo = this.tipo();
    if (!bodega || !tipo) return;

    this.enviando.set(true);
    this.error.set(null);
    const detalle = this.detalle().trim();
    this.emergenciaService.reportar({ bodega, tipo, detalle: detalle || undefined }).subscribe({
      next: (respuesta) => {
        this.resultado.set(respuesta);
        this.enviando.set(false);
      },
      error: (err) => {
        const status: number = err?.status ?? 0;
        const sinAutorizacion = status === 401 || status === 403;
        this.error.set(
          sinAutorizacion
            ? `Sin autorización para enviar el aviso (${status}). Llame directamente al 132 (Bomberos).`
            : err?.error?.mensaje || `No se pudo enviar el aviso (${status}). Llame directamente al 132 (Bomberos).`
        );
        this.enviando.set(false);
      },
    });
  }
}
