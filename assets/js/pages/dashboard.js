import { initAppPage, AppConfig } from '../app.js';
import productoService from '../services/productoService.js';
import { extractImoClass, formatQuantity } from '../utils/format.js';
import { escapeHtml } from '../utils/dom.js';
import { logErrorForDebug } from '../utils/errors.js';
import { showToast } from '../components/toast.js';
import { setPageHeader } from '../components/layout.js';

initAppPage({
  activeNav: 'dashboard',
  pageTitle: 'Panel',
  breadcrumb: [{ label: 'Inicio', href: 'index.html' }, { label: 'Panel' }],
  onReady: loadDashboard,
});

async function loadDashboard() {
  setPageHeader(`
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
      <div>
        <h1 class="h3 mb-1">Panel de control</h1>
        <p class="text-secondary mb-0">Vista general de stock, bodegas y clasificación IMO de su operación.</p>
      </div>
      <a href="productos.html" class="btn btn-primary">
        <i class="bi bi-boxes me-1" aria-hidden="true"></i> Gestionar productos
      </a>
    </div>
  `);

  const content = document.getElementById('page-content-slot');
  content.innerHTML = renderLoading();

  try {
    const productos = await productoService.listar();
    content.innerHTML = renderDashboard(productos);
  } catch (error) {
    logErrorForDebug(error, 'dashboard');
    content.innerHTML = renderError();
    showToast(error.message || 'No se pudo cargar el panel.', 'error');
  }
}

function renderLoading() {
  return `
    <div class="text-center py-5" role="status" aria-live="polite">
      <div class="spinner-border text-primary" aria-hidden="true"></div>
      <p class="mt-3 text-secondary mb-0">Cargando datos del inventario…</p>
    </div>
  `;
}

function renderError() {
  return `
    <div class="alert alert-danger d-flex align-items-start gap-2" role="alert">
      <i class="bi bi-exclamation-octagon-fill fs-5" aria-hidden="true"></i>
      <div>
        <h2 class="h6 alert-heading mb-1">No se pudo obtener la información</h2>
        <p class="mb-2">${escapeHtml(AppConfig.supportHint)}</p>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="location.reload()">Reintentar</button>
      </div>
    </div>
  `;
}

function renderDashboard(productos) {
  const totalProductos = productos.length;
  const totalUnidades = productos.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);
  const bodegas = [...new Set(productos.map((p) => p.bodega).filter(Boolean))].sort();
  const clases = [...new Set(productos.map((p) => extractImoClass(p.imo)).filter(Boolean))].sort();

  const lowStock = [...productos]
    .filter((p) => Number(p.cantidad) < 300)
    .sort((a, b) => (Number(a.cantidad) || 0) - (Number(b.cantidad) || 0))
    .slice(0, 5);

  return `
    <section aria-labelledby="dashboard-kpis-title" class="mb-4">
      <h2 id="dashboard-kpis-title" class="visually-hidden">Indicadores principales</h2>
      <div class="row g-3">
        ${kpiCard('Productos registrados', formatQuantity(totalProductos), 'boxes', 'brand')}
        ${kpiCard('Unidades en stock', formatQuantity(totalUnidades), 'stack', 'brand')}
        ${kpiCard('Bodegas activas', formatQuantity(bodegas.length), 'building', 'accent')}
        ${kpiCard('Clases IMO', formatQuantity(clases.length), 'shield-exclamation', 'accent')}
      </div>
    </section>

    <div class="row g-4">
      <div class="col-lg-7">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-transparent border-bottom-0 pt-3 pb-0">
            <h2 class="h5 card-title mb-0">Stock bajo (&lt; 300 u.)</h2>
          </div>
          <div class="card-body">
            ${lowStock.length ? renderLowStockTable(lowStock) : emptyState('No hay productos con stock bajo en este momento.')}
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-transparent border-bottom-0 pt-3 pb-0">
            <h2 class="h5 card-title mb-0">Distribución por bodega</h2>
          </div>
          <div class="card-body">
            ${renderBodegaBreakdown(productos, bodegas)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function kpiCard(label, value, icon, tone) {
  const toneClass = tone === 'accent' ? 'kpi-icon--accent' : 'kpi-icon--brand';
  return `
    <div class="col-sm-6 col-xl-3">
      <article class="card kpi-card shadow-sm border-0 h-100">
        <div class="card-body d-flex align-items-center gap-3">
          <div class="kpi-icon ${toneClass} rounded-3 p-3">
            <i class="bi bi-${icon} fs-4" aria-hidden="true"></i>
          </div>
          <div>
            <p class="text-secondary small mb-1">${escapeHtml(label)}</p>
            <p class="h4 mb-0 fw-semibold">${escapeHtml(value)}</p>
          </div>
        </div>
      </article>
    </div>
  `;
}

function renderLowStockTable(items) {
  return `
    <div class="table-responsive">
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Bodega</th>
            <th scope="col" class="text-end">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (p) => `
            <tr>
              <td>${escapeHtml(p.nombre)}</td>
              <td>${escapeHtml(p.bodega)}</td>
              <td class="text-end"><span class="badge text-bg-warning-subtle border text-warning-emphasis">${formatQuantity(p.cantidad)}</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderBodegaBreakdown(productos, bodegas) {
  if (!bodegas.length) return emptyState('Sin datos de bodegas.');

  const counts = bodegas.map((b) => ({
    bodega: b,
    count: productos.filter((p) => p.bodega === b).length,
  }));

  const max = Math.max(...counts.map((c) => c.count), 1);

  return `
    <ul class="list-group list-group-flush">
      ${counts
        .map(({ bodega, count }) => {
          const width = Math.round((count / max) * 100);
          return `
          <li class="list-group-item px-0">
            <div class="d-flex justify-content-between small mb-1">
              <span>${escapeHtml(bodega)}</span>
              <span class="text-secondary">${formatQuantity(count)} productos</span>
            </div>
            <div class="progress progress-thin" role="progressbar" aria-valuenow="${width}" aria-valuemin="0" aria-valuemax="100" aria-label="Productos en ${escapeHtml(bodega)}">
              <div class="progress-bar" style="width: ${width}%"></div>
            </div>
          </li>
        `;
        })
        .join('')}
    </ul>
  `;
}

function emptyState(message) {
  return `
    <div class="text-center text-secondary py-4">
      <i class="bi bi-inbox fs-2 d-block mb-2" aria-hidden="true"></i>
      <p class="mb-0">${escapeHtml(message)}</p>
    </div>
  `;
}
