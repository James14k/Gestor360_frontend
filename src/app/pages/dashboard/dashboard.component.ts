import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ENV } from '../../core/env';
import { ProductoService } from '../../core/services/producto.service';
import { ProductoSuspel } from '../../core/models/producto.model';
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

  protected readonly lowStock = computed(() =>
    [...this.productos()]
      .filter((p) => Number(p.cantidad) < UMBRAL_STOCK_BAJO)
      .sort((a, b) => (Number(a.cantidad) || 0) - (Number(b.cantidad) || 0))
      .slice(0, 5)
  );

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
  }

  protected reload(): void {
    this.loadDashboard();
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
