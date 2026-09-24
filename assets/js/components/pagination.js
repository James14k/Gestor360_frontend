import { escapeHtml } from '../utils/dom.js';

export function renderPagination({ page, totalPages, onPageChange, container }) {
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    container.hidden = true;
    return;
  }

  container.hidden = false;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const pages = buildPageList(page, totalPages);

  container.innerHTML = `
    <nav aria-label="Paginación de resultados">
      <ul class="pagination pagination-sm mb-0 justify-content-center flex-wrap">
        <li class="page-item ${prevDisabled ? 'disabled' : ''}">
          <button class="page-link" type="button" data-page="${page - 1}" ${prevDisabled ? 'disabled' : ''} aria-label="Página anterior">
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </button>
        </li>
        ${pages
          .map((p) => {
            if (p === '…') {
              return `<li class="page-item disabled"><span class="page-link">…</span></li>`;
            }
            const active = p === page ? 'active' : '';
            return `<li class="page-item ${active}">
              <button class="page-link" type="button" data-page="${p}" ${active ? 'aria-current="page"' : ''}>${p}</button>
            </li>`;
          })
          .join('')}
        <li class="page-item ${nextDisabled ? 'disabled' : ''}">
          <button class="page-link" type="button" data-page="${page + 1}" ${nextDisabled ? 'disabled' : ''} aria-label="Página siguiente">
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    </nav>
  `;

  container.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = Number(btn.dataset.page);
      if (target >= 1 && target <= totalPages && target !== page) {
        onPageChange(target);
      }
    });
  });
}

function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p += 1) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export function paginateItems(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  };
}
