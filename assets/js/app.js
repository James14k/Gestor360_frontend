import AppConfig from './config.js';

/**
 * Bootstrap global de la aplicación (páginas internas).
 */
export function initAppPage({ activeNav, pageTitle, breadcrumb, onReady }) {
  document.addEventListener('DOMContentLoaded', async () => {
    const { mountAppLayout } = await import('./components/layout.js');
    mountAppLayout({ activeNav, pageTitle, breadcrumb });

    if (typeof onReady === 'function') {
      await onReady();
    }

    document.querySelectorAll('.app-sidebar-link').forEach((link) => {
      link.addEventListener('click', () => {
        const offcanvasEl = document.getElementById('appSidebarOffcanvas');
        if (offcanvasEl && window.bootstrap) {
          const instance = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
          if (instance) instance.hide();
        }
      });
    });
  });
}

export { AppConfig };
