import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ENV } from '../../core/env';
import { ProductoService } from '../../core/services/producto.service';
import { ProductoSuspel } from '../../core/models/producto.model';
import { Notificacion } from '../../core/models/actividad.model';
import { ActividadService } from '../../core/services/actividad.service';
import { ToastService } from '../../shared/toast/toast.service';
import { extractImoClass, formatQuantity } from '../../shared/format.util';

interface SectorStock {
  sector: string;
  unidades: number;
  productos: number;
  conStockBajo: number;
  widthPct: number;
}

const UMBRAL_STOCK_BAJO = 300;
const MAX_ALERTAS = 6;
const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' });

/** "Bodega A-01" y "Bodega A-02" pertenecen al sector A. */
function sectorDe(bodega: string): string {
  const match = bodega.match(/bodega\s+([a-z])/i);
  return match ? `Sector ${match[1].toUpperCase()}` : bodega;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly productoService = inject(ProductoService);
  private readonly actividadService = inject(ActividadService);
  private readonly toast = inject(ToastService);

  protected readonly env = ENV;
  protected readonly loading = signal(true);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly productos = signal<ProductoSuspel[]>([]);

  protected readonly totalProductos = computed(() => this.productos().length);

  protected readonly totalUnidades = computed(() =>
    this.productos().reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0)
  );

  protected readonly bodegasActivas = computed(
    () => new Set(this.productos().map((p) => p.bodega).filter(Boolean)).size
  );

  protected readonly clasesImo = computed(
    () => new Set(this.productos().map((p) => extractImoClass(p.imo)).filter(Boolean)).size
  );

  protected readonly alertas = signal<Notificacion[]>([]);
  protected readonly alertasLoading = signal(true);
  protected readonly alertasError = signal(false);
  protected readonly umbral = UMBRAL_STOCK_BAJO;

  protected readonly stockPorSector = computed<SectorStock[]>(() => {
    const sectores = new Map<string, Omit<SectorStock, 'widthPct'>>();
    for (const p of this.productos()) {
      if (!p.bodega) continue;
      const sector = sectorDe(p.bodega);
      const cantidad = Number(p.cantidad) || 0;
      const actual = sectores.get(sector) ?? { sector, unidades: 0, productos: 0, conStockBajo: 0 };
      actual.unidades += cantidad;
      actual.productos += 1;
      if (cantidad < UMBRAL_STOCK_BAJO) actual.conStockBajo += 1;
      sectores.set(sector, actual);
    }
    const lista = [...sectores.values()].sort((a, b) => b.unidades - a.unidades);
    const max = Math.max(...lista.map((s) => s.unidades), 1);
    return lista.map((s) => ({ ...s, widthPct: Math.max(2, Math.round((s.unidades / max) * 100)) }));
  });

  protected readonly formatQuantity = formatQuantity;

  constructor() {
    this.loadDashboard();
    this.loadAlertas();
  }

  protected reload(): void {
    this.loadDashboard();
    this.loadAlertas();
  }

  protected loadAlertas(): void {
    this.alertasLoading.set(true);
    this.alertasError.set(false);
    this.actividadService.notificaciones().subscribe({
      next: (alertas) => {
        this.alertas.set(alertas.slice(0, MAX_ALERTAS));
        this.alertasLoading.set(false);
      },
      error: () => {
        this.alertasError.set(true);
        this.alertasLoading.set(false);
      },
    });
  }

  protected fecha(valor: string): string {
    return valor ? FORMATO_FECHA.format(new Date(valor)) : '';
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.loading.set(false);
      },
      error: (error) => {
        const message = error?.error?.message || 'No se pudo obtener la información del inventario.';
        this.errorMsg.set(message);
        this.loading.set(false);
        this.toast.show(message, 'error');
      },
    });
  }
}
