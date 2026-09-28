import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ENV } from '../../core/env';
import { ProductoService } from '../../core/services/producto.service';
import { ProductoSuspel } from '../../core/models/producto.model';
import { ToastService } from '../../shared/toast/toast.service';
import { compareNumbers, compareStrings, extractImoClass, formatQuantity } from '../../shared/format.util';
import { buildPageList, paginateItems, type PageEntry } from '../../shared/pagination.util';
import { validateProducto } from '../../shared/producto-validator.util';

type SortKey = 'id' | 'nombre' | 'imo' | 'bodega' | 'cantidad';
type SortDir = 'asc' | 'desc';
type FormMode = 'create' | 'edit';

interface ProductoFormModel {
  nombre: string;
  imo: string;
  bodega: string;
  cantidad: string;
}

const IMO_SUGGESTIONS = [
  'Clase 2.1 - Gas Inflamable',
  'Clase 2.2 - Gas No Inflamable No Tóxico',
  'Clase 3 - Líquido Inflamable',
  'Clase 4.1 - Sólido Inflamable',
  'Clase 4.2 - Combustión Espontánea',
  'Clase 4.3 - Peligroso en Contacto con Agua',
  'Clase 5.1 - Comburente',
  'Clase 5.2 - Peróxido Orgánico',
  'Clase 6.1 - Tóxico',
  'Clase 8 - Corrosivo',
  'Clase 9 - Misceláneo',
];

function emptyForm(): ProductoFormModel {
  return { nombre: '', imo: '', bodega: '', cantidad: '' };
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './productos.component.html',
})
export class ProductosComponent {
  private readonly productoService = inject(ProductoService);
  private readonly toast = inject(ToastService);

  protected readonly imoSuggestions = IMO_SUGGESTIONS;
  protected readonly pageSizeOptions = ENV.pagination.pageSizeOptions;

  protected readonly productos = signal<ProductoSuspel[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly filterQ = signal('');
  protected readonly filterBodega = signal('');
  protected readonly filterImoClass = signal('');

  protected readonly searchMode = signal<'list' | 'id'>('list');
  protected readonly idQuery = signal('');
  protected readonly idSearching = signal(false);
  protected readonly idResult = signal<ProductoSuspel | null>(null);
  protected readonly idError = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal<number>(ENV.pagination.defaultPageSize);
  protected readonly sortKey = signal<SortKey>('nombre');
  protected readonly sortDir = signal<SortDir>('asc');

  protected readonly showFormModal = signal(false);
  protected readonly formMode = signal<FormMode>('create');
  protected readonly editingId = signal<number | null>(null);
  protected readonly formModel = signal<ProductoFormModel>(emptyForm());
  protected readonly formErrors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);

  protected readonly showConfirmModal = signal(false);
  protected readonly confirmTarget = signal<ProductoSuspel | null>(null);
  protected readonly deleting = signal(false);

  protected readonly formatQuantity = formatQuantity;

  protected readonly bodegaOptions = computed(() =>
    [...new Set(this.productos().map((p) => p.bodega).filter(Boolean))].sort(compareStrings)
  );

  protected readonly imoClassOptions = computed(() =>
    [...new Set(this.productos().map((p) => extractImoClass(p.imo)).filter(Boolean))].sort(compareStrings)
  );

  protected readonly filtered = computed(() => {
    const q = this.filterQ().trim().toLowerCase();
    const bodega = this.filterBodega();
    const imoClass = this.filterImoClass();

    const result = this.productos().filter((p) => {
      const haystack = `${p.nombre} ${p.imo} ${p.bodega}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (bodega && p.bodega !== bodega) return false;
      if (imoClass && extractImoClass(p.imo) !== imoClass) return false;
      return true;
    });

    const key = this.sortKey();
    const dir = this.sortDir() === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      if (key === 'cantidad') return compareNumbers(a.cantidad, b.cantidad) * dir;
      if (key === 'id') return compareNumbers(a.id, b.id) * dir;
      return compareStrings(a[key], b[key]) * dir;
    });

    return result;
  });

  protected readonly paginated = computed(() => paginateItems(this.filtered(), this.page(), this.pageSize()));

  protected readonly pageList = computed<PageEntry[]>(() => {
    const { page, totalPages } = this.paginated();
    return buildPageList(page, totalPages);
  });

  constructor() {
    this.refreshProductos();
  }

  protected sortIcon(key: SortKey): string {
    if (this.sortKey() !== key) return 'arrow-down-up';
    return this.sortDir() === 'asc' ? 'sort-up' : 'sort-down';
  }

  protected toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected onFiltersChanged(): void {
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.filterQ.set('');
    this.filterBodega.set('');
    this.filterImoClass.set('');
    this.page.set(1);
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    localStorage.setItem(ENV.storageKeys.pageSize, value);
    this.page.set(1);
  }

  protected goToPage(target: number): void {
    const { totalPages } = this.paginated();
    if (target >= 1 && target <= totalPages) {
      this.page.set(target);
    }
  }

  protected buscarPorId(): void {
    const raw = this.idQuery().toString().trim();
    const id = Number(raw);
    this.idResult.set(null);

    if (!raw || !Number.isInteger(id) || id < 1) {
      this.idError.set('Ingresa un ID numérico válido (entero mayor a 0).');
      return;
    }

    this.idError.set(null);
    this.idSearching.set(true);
    this.productoService.obtener(id).subscribe({
      next: (producto) => {
        this.idResult.set(producto);
        this.idSearching.set(false);
      },
      error: (error) => {
        this.idError.set(
          error?.status === 404
            ? `No existe un producto con ID ${id}.`
            : error?.error?.message || 'No fue posible buscar el producto.'
        );
        this.idSearching.set(false);
      },
    });
  }

  protected setSearchMode(mode: 'list' | 'id'): void {
    if (mode === 'list') this.clearIdSearch();
    this.searchMode.set(mode);
  }

  protected clearIdSearch(): void {
    this.idQuery.set('');
    this.idResult.set(null);
    this.idError.set(null);
  }

  private refreshIdResult(): void {
    const current = this.idResult();
    if (current?.id == null) return;
    this.productoService.obtener(current.id).subscribe({
      next: (producto) => this.idResult.set(producto),
      error: () => this.idResult.set(null),
    });
  }

  protected refreshProductos(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.loading.set(false);
      },
      error: (error) => {
        const message = error?.error?.message || 'No fue posible cargar los productos.';
        this.loadError.set(message);
        this.loading.set(false);
        this.toast.show(message, 'error');
      },
    });
  }

  protected openCreateForm(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.formModel.set(emptyForm());
    this.formErrors.set({});
    this.showFormModal.set(true);
  }

  protected openEditForm(producto: ProductoSuspel): void {
    this.formMode.set('edit');
    this.editingId.set(producto.id ?? null);
    this.formModel.set({
      nombre: producto.nombre,
      imo: producto.imo,
      bodega: producto.bodega,
      cantidad: String(producto.cantidad),
    });
    this.formErrors.set({});
    this.showFormModal.set(true);
  }

  protected closeFormModal(): void {
    this.showFormModal.set(false);
  }

  protected updateFormField<K extends keyof ProductoFormModel>(field: K, value: ProductoFormModel[K]): void {
    this.formModel.update((current) => ({ ...current, [field]: value }));
  }

  protected submitForm(): void {
    const validation = validateProducto(this.formModel());
    if (!validation.valid) {
      this.formErrors.set(validation.errors);
      this.toast.show('Revisa los campos marcados en el formulario.', 'warning');
      return;
    }

    this.formErrors.set({});
    this.saving.set(true);

    const mode = this.formMode();
    const id = this.editingId();
    const request =
      mode === 'edit' && id != null
        ? this.productoService.actualizar(id, validation.values)
        : this.productoService.crear(validation.values);

    request.subscribe({
      next: () => {
        this.toast.show(
          mode === 'edit' ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
          'success'
        );
        this.saving.set(false);
        this.showFormModal.set(false);
        this.refreshProductos();
        this.refreshIdResult();
      },
      error: (error) => {
        const message = error?.error?.message || 'No fue posible guardar el producto.';
        this.toast.show(message, 'error');
        this.saving.set(false);
      },
    });
  }

  protected askDelete(producto: ProductoSuspel): void {
    this.confirmTarget.set(producto);
    this.showConfirmModal.set(true);
  }

  protected cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.confirmTarget.set(null);
  }

  protected confirmDelete(): void {
    const producto = this.confirmTarget();
    if (!producto?.id) return;

    this.deleting.set(true);
    this.productoService.eliminar(producto.id).subscribe({
      next: () => {
        this.toast.show('Producto eliminado correctamente.', 'success');
        this.deleting.set(false);
        this.showConfirmModal.set(false);
        this.confirmTarget.set(null);
        if (this.idResult()?.id === producto.id) this.idResult.set(null);
        this.refreshProductos();
      },
      error: (error) => {
        const message = error?.error?.message || 'No fue posible eliminar el producto.';
        this.toast.show(message, 'error');
        this.deleting.set(false);
      },
    });
  }
}
