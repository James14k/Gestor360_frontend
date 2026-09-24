import AppConfig from '../config.js';
import { escapeHtml } from '../utils/dom.js';

const NAV_ITEMS = [
  { id: 'dashboard', href: 'dashboard.html', label: 'Panel', icon: 'speedometer2' },
  { id: 'productos', href: 'productos.html', label: 'Productos', icon: 'boxes' },
];

function navLink(item, activeId, basePath) {
  const isActive = item.id === activeId;
  return `
    <li class="nav-item">
      <a class="nav-link app-sidebar-link ${isActive ? 'active' : ''}"
         href="${basePath}${item.href}"
         ${isActive ? 'aria-current="page"' : ''}>
        <i class="bi bi-${item.icon}" aria-hidden="true"></i>
        <span>${escapeHtml(item.label)}</span>
      </a>
    </li>
  `;
}

export function mountAppLayout({ activeNav, pageTitle, breadcrumb = [] }) {
  const shell = document.getElementById('app-shell');
  if (!shell) return;

  const isInPages = window.location.pathname.includes('/pages/');
  const assetBase = isInPages ? '../' : '';
  const pagesBase = isInPages ? '' : 'pages/';

  document.title = pageTitle ? `${pageTitle} | ${AppConfig.appName}` : AppConfig.appName;

  shell.innerHTML = `
    <div class="app-layout">
      <header class="app-topbar navbar navbar-expand-lg border-bottom bg-body sticky-top">
        <div class="container-fluid px-3 px-lg-4">
          <button class="btn btn-outline-secondary d-lg-none me-2" type="button"
                  data-bs-toggle="offcanvas" data-bs-target="#appSidebarOffcanvas"
                  aria-controls="appSidebarOffcanvas" aria-label="Abrir menú">
            <i class="bi bi-list" aria-hidden="true"></i>
          </button>
          <a class="navbar-brand d-flex align-items-center gap-2 fw-semibold" href="${assetBase}index.html">
            <span class="app-brand-mark" aria-hidden="true"><i class="bi bi-shield-check"></i></span>
            <span>${escapeHtml(AppConfig.appName)}</span>
          </a>
          <div class="ms-auto d-none d-md-block text-end">
            <p class="app-topbar-tagline mb-0">${escapeHtml(AppConfig.companyLine)}</p>
          </div>
        </div>
      </header>

      <div class="offcanvas-lg offcanvas-start app-sidebar-offcanvas" tabindex="-1" id="appSidebarOffcanvas" aria-labelledby="appSidebarOffcanvasLabel">
        <div class="offcanvas-header border-bottom d-lg-none">
          <h2 class="offcanvas-title h5" id="appSidebarOffcanvasLabel">Menú</h2>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#appSidebarOffcanvas" aria-label="Cerrar"></button>
        </div>
        <div class="offcanvas-body p-0">
          ${renderSidebarNav(activeNav, pagesBase)}
        </div>
      </div>

      <aside class="app-sidebar d-none d-lg-block border-end">
        ${renderSidebarNav(activeNav, pagesBase)}
      </aside>

      <main class="app-main" id="main-content">
        <div class="container-fluid px-3 px-lg-4 py-4">
          ${renderBreadcrumb(breadcrumb, assetBase)}
          <div id="page-header-slot"></div>
          <div id="page-content-slot"></div>
        </div>
      </main>

      <footer class="app-footer border-top bg-body-tertiary">
        <div class="container-fluid px-3 px-lg-4 py-3 small text-secondary d-flex flex-wrap justify-content-between gap-2">
          <span>&copy; ${new Date().getFullYear()} ${escapeHtml(AppConfig.appName)} — ${escapeHtml(AppConfig.appTagline)}</span>
          <span class="text-secondary">Sistema de gestión Suspel</span>
        </div>
      </footer>
    </div>
  `;
}

function renderSidebarNav(activeNav, pagesBase) {
  return `
    <nav class="app-sidebar-nav" aria-label="Navegación principal">
      <div class="px-3 py-3">
        <p class="text-uppercase text-secondary small fw-semibold mb-2 px-2">Operaciones</p>
        <ul class="nav nav-pills flex-column gap-1">
          ${NAV_ITEMS.map((item) => navLink(item, activeNav, pagesBase)).join('')}
        </ul>
      </div>
    </nav>
  `;
}

function renderBreadcrumb(items, assetBase) {
  if (!items.length) return '';
  const crumbs = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast || !item.href) {
        return `<li class="breadcrumb-item active" aria-current="page">${escapeHtml(item.label)}</li>`;
      }
      const href = item.href.startsWith('http') ? item.href : `${assetBase}${item.href}`;
      return `<li class="breadcrumb-item"><a href="${href}">${escapeHtml(item.label)}</a></li>`;
    })
    .join('');

  return `
    <nav aria-label="Ruta de navegación" class="mb-3">
      <ol class="breadcrumb mb-0">${crumbs}</ol>
    </nav>
  `;
}

export function setPageHeader(html) {
  const slot = document.getElementById('page-header-slot');
  if (slot) slot.innerHTML = html;
}
