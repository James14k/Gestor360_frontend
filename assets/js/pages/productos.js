import { initAppPage } from '../app.js';
import AppConfig from '../config.js';
import productoService from '../services/productoService.js';
import { showToast } from '../components/toast.js';
import { confirmAction } from '../components/confirmModal.js';
import { paginateItems, renderPagination } from '../components/pagination.js';
import { setPageHeader } from '../components/layout.js';
import {
  validateProducto,
  applyFieldErrors,
  clearFieldErrors,
} from '../validators/productoValidator.js';
import { escapeHtml, qs, setLoading } from '../utils/dom.js';
import { compareNumbers, compareStrings, extractImoClass, formatQuantity } from '../utils/format.js';
import { logErrorForDebug } from '../utils/errors.js';
import { readJson, writeJson } from '../utils/storage.js';

const state = {
  productos: [],
  filtered: [],
  loading: false,
  page: 1,
  pageSize: readJson(AppConfig.storageKeys.pageSize, AppConfig.pagination.defaultPageSize),
  sortKey: 'nombre',
  sortDir: 'asc',
  filters: {
    q: '',
    bodega: '',
    imoClass: '',
  },
};

let formModal = null;
let formMode = 'create';
let editingId = null;

initAppPage({
  activeNav: 'productos',
  pageTitle: 'Productos',
  breadcrumb: [{ label: 'Inicio', href: '../index.html' }, { label: 'Productos' }],
  onReady: initProductosPage,
});

async function initProductosPage() {
  setPageHeader(`
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        <h1 class="h3 mb-1">Productos Suspel</h1>
        <p class="text-secondary mb-0">Registro, actualización y control de existencias por bodega.</p>
      </div>
      <button type="button" class="btn btn-primary" id="btn-new-product">
        <i class="bi bi-plus-lg me-1" aria-hidden="true"></i> Nuevo producto
      </button>
    </div>
  `);

  renderPageSkeleton();
  bindStaticEvents();
  await refreshProductos();
}

function renderPageSkeleton() {
  const content = document.getElementById('page-content-slot');
  content.innerHTML = `
    <section class="card shadow-sm mb-3" aria-labelledby="filters-title">
      <div class="card-body">
        <h2 id="filters-title" class="h6 text-secondary text-uppercase fw-semibold mb-3">Filtros y búsqueda</h2>
        <form id="filters-form" class="row g-3 align-items-end">
          <div class="col-md-4">
            <label for="filter-q" class="form-label">Buscar</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
              <input type="search" class="form-control" id="filter-q" name="q" placeholder="Nombre, IMO o bodega" autocomplete="off">
            </div>
          </div>
          <div class="col-md-3">
            <label for="filter-bodega" class="form-label">Bodega</label>
            <select class="form-select" id="filter-bodega" name="bodega">
              <option value="">Todas</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="filter-imo" class="form-label">Clase IMO</label>
            <select class="form-select" id="filter-imo" name="imoClass">
              <option value="">Todas</option>
            </select>
          </div>
          <div class="col-md-2 d-grid">
            <button type="button" class="btn btn-outline-secondary" id="btn-clear-filters">Limpiar</button>
          </div>
        </form>
      </div>
    </section>

    <section class="card shadow-sm" aria-labelledby="products-table-title">
      <div class="card-header bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
        <div>
          <h2 id="products-table-title" class="h5 mb-0">Listado de productos</h2>
          <p class="small text-secondary mb-0" id="results-summary" aria-live="polite"></p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <label for="page-size" class="small text-secondary mb-0">Filas</label>
          <select class="form-select form-select-sm w-auto" id="page-size">
            ${AppConfig.pagination.pageSizeOptions.map((n) => `<option value="${n}" ${n === state.pageSize ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="card-body p-0" id="table-container">
        <div class="text-center py-5" role="status">
          <div class="spinner-border text-primary" aria-hidden="true"></div>
          <p class="mt-3 text-secondary mb-0">Cargando productos…</p>
        </div>
      </div>
      <div class="card-footer bg-transparent d-flex justify-content-center py-3" id="pagination-container" hidden></div>
    </section>

    ${renderProductModal()}
  `;

  formModal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('productFormModal'));
}

function renderProductModal() {
  return `
    <div class="modal fade" id="productFormModal" tabindex="-1" aria-labelledby="productFormModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <form id="product-form" novalidate>
            <div class="modal-header">
              <h2 class="modal-title fs-5" id="productFormModalLabel">Nuevo producto</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label for="field-nombre" class="form-label">Nombre <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="field-nombre" name="nombre" required maxlength="200" autocomplete="off">
                  <div class="invalid-feedback d-block" data-field-error="nombre" hidden></div>
                </div>
                <div class="col-12">
                  <label for="field-imo" class="form-label">Clasificación IMO <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="field-imo" name="imo" required maxlength="500"
                         placeholder="Ej.: Clase 3 - Líquido Inflamable" list="imo-suggestions">
                  <datalist id="imo-suggestions">
                    <option value="Clase 2.1 - Gas Inflamable"></option>
                    <option value="Clase 2.2 - Gas No Inflamable No Tóxico"></option>
                    <option value="Clase 3 - Líquido Inflamable"></option>
                    <option value="Clase 4.1 - Sólido Inflamable"></option>
                    <option value="Clase 4.2 - Combustión Espontánea"></option>
                    <option value="Clase 4.3 - Peligroso en Contacto con Agua"></option>
                    <option value="Clase 5.1 - Comburente"></option>
                    <option value="Clase 5.2 - Peróxido Orgánico"></option>
                    <option value="Clase 6.1 - Tóxico"></option>
                    <option value="Clase 8 - Corrosivo"></option>
                    <option value="Clase 9 - Misceláneo"></option>
                  </datalist>
                  <div class="invalid-feedback d-block" data-field-error="imo" hidden></div>
                </div>
                <div class="col-md-6">
                  <label for="field-bodega" class="form-label">Bodega <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="field-bodega" name="bodega" required maxlength="100" autocomplete="off">
                  <div class="invalid-feedback d-block" data-field-error="bodega" hidden></div>
                </div>
                <div class="col-md-6">
                  <label for="field-cantidad" class="form-label">Cantidad <span class="text-danger">*</span></label>
                  <input type="number" class="form-control" id="field-cantidad" name="cantidad" required min="0" step="1" inputmode="numeric">
                  <div class="invalid-feedback d-block" data-field-error="cantidad" hidden></div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="product-form-submit">Guardar producto</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function bindStaticEvents() {
  document.getElementById('btn-new-product').addEventListener('click', () => openForm('create'));
  document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
  document.getElementById('filters-form').addEventListener('input', onFiltersChanged);
  document.getElementById('filters-form').addEventListener('change', onFiltersChanged);
  document.getElementById('page-size').addEventListener('change', (e) => {
    state.pageSize = Number(e.target.value);
    writeJson(AppConfig.storageKeys.pageSize, state.pageSize);
    state.page = 1;
    renderTable();
  });
  document.getElementById('product-form').addEventListener('submit', onSubmitForm);
}

async function refreshProductos() {
  state.loading = true;
  renderTableLoading();
  try {
    state.productos = await productoService.listar();
    populateFilterOptions();
    applyFiltersAndRender();
  } catch (error) {
    logErrorForDebug(error, 'productos.list');
    renderTableError(error.message);
    showToast(error.message, 'error');
  } finally {
    state.loading = false;
  }
}

function populateFilterOptions() {
  const bodegaSelect = document.getElementById('filter-bodega');
  const imoSelect = document.getElementById('filter-imo');
  const bodegas = [...new Set(state.productos.map((p) => p.bodega).filter(Boolean))].sort(compareStrings);
  const clases = [...new Set(state.productos.map((p) => extractImoClass(p.imo)).filter(Boolean))].sort(compareStrings);

  const currentBodega = state.filters.bodega;
  const currentImo = state.filters.imoClass;

  bodegaSelect.innerHTML = `<option value="">Todas</option>${bodegas.map((b) => `<option value="${escapeHtml(b)}" ${b === currentBodega ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}`;
  imoSelect.innerHTML = `<option value="">Todas</option>${clases.map((c) => `<option value="${escapeHtml(c)}" ${c === currentImo ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}`;
}

function onFiltersChanged() {
  state.filters.q = document.getElementById('filter-q').value.trim().toLowerCase();
  state.filters.bodega = document.getElementById('filter-bodega').value;
  state.filters.imoClass = document.getElementById('filter-imo').value;
  state.page = 1;
  applyFiltersAndRender();
}

function clearFilters() {
  document.getElementById('filter-q').value = '';
  document.getElementById('filter-bodega').value = '';
  document.getElementById('filter-imo').value = '';
  state.filters = { q: '', bodega: '', imoClass: '' };
  state.page = 1;
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  const { q, bodega, imoClass } = state.filters;
  state.filtered = state.productos.filter((p) => {
    const haystack = `${p.nombre || ''} ${p.imo || ''} ${p.bodega || ''}`.toLowerCase();
    if (q && !haystack.includes(q)) return false;
    if (bodega && p.bodega !== bodega) return false;
    if (imoClass && extractImoClass(p.imo) !== imoClass) return false;
    return true;
  });

  sortFiltered();
  renderTable();
}

function sortFiltered() {
  const { sortKey, sortDir } = state;
  const dir = sortDir === 'desc' ? -1 : 1;
  state.filtered.sort((a, b) => {
    if (sortKey === 'cantidad') return compareNumbers(a.cantidad, b.cantidad) * dir;
    if (sortKey === 'id') return compareNumbers(a.id, b.id) * dir;
    return compareStrings(a[sortKey], b[sortKey]) * dir;
  });
}

function renderTableLoading() {
  document.getElementById('table-container').innerHTML = `
    <div class="text-center py-5" role="status">
      <div class="spinner-border text-primary" aria-hidden="true"></div>
      <p class="mt-3 text-secondary mb-0">Cargando productos…</p>
    </div>
  `;
}

function renderTableError(message) {
  document.getElementById('table-container').innerHTML = `
    <div class="p-4">
      <div class="alert alert-danger mb-0" role="alert">
        <h3 class="h6 alert-heading">Error al cargar productos</h3>
        <p class="mb-0">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
  document.getElementById('results-summary').textContent = '';
  document.getElementById('pagination-container').hidden = true;
}

function renderTable() {
  const container = document.getElementById('table-container');
  const summary = document.getElementById('results-summary');
  const paginationContainer = document.getElementById('pagination-container');

  if (!state.filtered.length) {
    summary.textContent = state.productos.length
      ? '0 resultados con los filtros actuales.'
      : 'No hay productos registrados todavía.';
    container.innerHTML = `
      <div class="empty-state py-5 px-3 text-center">
        <i class="bi bi-inbox fs-1 text-secondary" aria-hidden="true"></i>
        <h3 class="h5 mt-3">Sin resultados</h3>
        <p class="text-secondary mb-3">${state.productos.length ? 'Prueba ajustando los filtros de búsqueda.' : 'Crea el primer producto Suspel con el botón «Nuevo producto».'}</p>
        ${state.productos.length ? '' : '<button type="button" class="btn btn-primary" data-open-create>Crear producto</button>'}
      </div>
    `;
    const createBtn = container.querySelector('[data-open-create]');
    if (createBtn) createBtn.addEventListener('click', () => openForm('create'));
    paginationContainer.hidden = true;
    return;
  }

  const { items, page, totalPages, total } = paginateItems(state.filtered, state.page, state.pageSize);
  state.page = page;

  summary.textContent = `Mostrando ${items.length} de ${total} resultado${total === 1 ? '' : 's'}.`;

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0 app-table">
        <thead>
          <tr>
            ${sortableHeader('id', 'ID')}
            ${sortableHeader('nombre', 'Nombre')}
            ${sortableHeader('imo', 'Clasificación IMO')}
            ${sortableHeader('bodega', 'Bodega')}
            ${sortableHeader('cantidad', 'Cantidad', 'text-end')}
            <th scope="col" class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((p) => renderRow(p)).join('')}
        </tbody>
      </table>
    </div>
  `;

  bindRowActions(container);
  bindSortHeaders(container);

  renderPagination({
    page,
    totalPages,
    container: paginationContainer,
    onPageChange: (newPage) => {
      state.page = newPage;
      renderTable();
    },
  });
}

function sortableHeader(key, label, extraClass = '') {
  const active = state.sortKey === key;
  const icon = !active ? 'arrow-down-up' : state.sortDir === 'asc' ? 'sort-up' : 'sort-down';
  return `
    <th scope="col" class="${extraClass}">
      <button type="button" class="btn btn-link btn-sm table-sort-btn p-0 ${active ? 'active' : ''}" data-sort="${key}">
        ${escapeHtml(label)}
        <i class="bi bi-${icon} ms-1" aria-hidden="true"></i>
      </button>
    </th>
  `;
}

function renderRow(producto) {
  const stockClass = Number(producto.cantidad) < 300 ? 'text-warning-emphasis fw-semibold' : '';
  return `
    <tr data-id="${producto.id}">
      <td data-label="ID">${escapeHtml(producto.id)}</td>
      <td data-label="Nombre">${escapeHtml(producto.nombre)}</td>
      <td data-label="IMO"><span class="badge badge-imo">${escapeHtml(extractImoClass(producto.imo))}</span><span class="d-block small text-secondary mt-1">${escapeHtml(producto.imo)}</span></td>
      <td data-label="Bodega">${escapeHtml(producto.bodega)}</td>
      <td data-label="Cantidad" class="text-md-end ${stockClass}">${formatQuantity(producto.cantidad)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm" role="group" aria-label="Acciones para ${escapeHtml(producto.nombre)}">
          <button type="button" class="btn btn-outline-secondary" data-action="edit" data-id="${producto.id}" aria-label="Editar ${escapeHtml(producto.nombre)}">
            <i class="bi bi-pencil" aria-hidden="true"></i>
          </button>
          <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${producto.id}" aria-label="Eliminar ${escapeHtml(producto.nombre)}">
            <i class="bi bi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function bindSortHeaders(container) {
  container.querySelectorAll('[data-sort]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      sortFiltered();
      renderTable();
    });
  });
}

function bindRowActions(container) {
  container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const producto = state.productos.find((p) => Number(p.id) === id);
      if (producto) openForm('edit', producto);
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const producto = state.productos.find((p) => Number(p.id) === id);
      if (!producto) return;

      const confirmed = await confirmAction({
        title: 'Eliminar producto',
        message: `¿Eliminar «${producto.nombre}»? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmClass: 'btn-danger',
      });

      if (!confirmed) return;

      try {
        await productoService.eliminar(id);
        showToast('Producto eliminado correctamente.', 'success');
        await refreshProductos();
      } catch (error) {
        logErrorForDebug(error, 'productos.delete');
        showToast(error.message, 'error');
      }
    });
  });
}

function openForm(mode, producto = null) {
  formMode = mode;
  editingId = producto?.id ?? null;
  const form = document.getElementById('product-form');
  clearFieldErrors(form);

  const title = document.getElementById('productFormModalLabel');
  const submit = document.getElementById('product-form-submit');
  title.textContent = mode === 'edit' ? 'Editar producto' : 'Nuevo producto';
  submit.textContent = mode === 'edit' ? 'Guardar cambios' : 'Guardar producto';

  form.nombre.value = producto?.nombre ?? '';
  form.imo.value = producto?.imo ?? '';
  form.bodega.value = producto?.bodega ?? '';
  form.cantidad.value = producto?.cantidad ?? '';

  formModal.show();
  setTimeout(() => form.nombre.focus(), 150);
}

async function onSubmitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitBtn = qs('#product-form-submit', form);

  const payload = {
    nombre: form.nombre.value,
    imo: form.imo.value,
    bodega: form.bodega.value,
    cantidad: form.cantidad.value,
  };

  const validation = validateProducto(payload, { isUpdate: formMode === 'edit' });
  if (!validation.valid) {
    applyFieldErrors(form, validation.errors);
    showToast('Revisa los campos marcados en el formulario.', 'warning');
    return;
  }

  clearFieldErrors(form);
  setLoading(submitBtn, true, 'Guardando…');

  try {
    if (formMode === 'edit' && editingId != null) {
      await productoService.actualizar(editingId, validation.values);
      showToast('Producto actualizado correctamente.', 'success');
    } else {
      await productoService.crear(validation.values);
      showToast('Producto creado correctamente.', 'success');
    }
    formModal.hide();
    await refreshProductos();
  } catch (error) {
    logErrorForDebug(error, 'productos.save');
    showToast(error.message, 'error');
  } finally {
    setLoading(submitBtn, false);
  }
}
