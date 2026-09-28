import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ENV } from '../../core/env';
import { ProductoService } from '../../core/services/producto.service';
import { ProductoSuspel } from '../../core/models/producto.model';
import { ToastService } from '../../shared/toast/toast.service';
import { extractImoClass, formatQuantity } from '../../shared/format.util';

interface BodegaCount {
  bodega: string;
  count: number;
  widthPct: number;
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
      .filter((p) => Number(p.cantidad) < 300)
      .sort((a, b) => (Number(a.cantidad) || 0) - (Number(b.cantidad) || 0))
      .slice(0, 5)
  );

  protected readonly bodegaBreakdown = computed<BodegaCount[]>(() => {
    const productos = this.productos();
    const bodegas = [...new Set(productos.map((p) => p.bodega).filter(Boolean))].sort();
    const counts = bodegas.map((bodega) => ({
      bodega,
      count: productos.filter((p) => p.bodega === bodega).length,
    }));
    const max = Math.max(...counts.map((c) => c.count), 1);
    return counts.map((c) => ({ ...c, widthPct: Math.round((c.count / max) * 100) }));
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
