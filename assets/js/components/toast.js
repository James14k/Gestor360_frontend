import { escapeHtml } from '../utils/dom.js';

let containerEl = null;

function ensureContainer() {
  if (containerEl) return containerEl;
  containerEl = document.createElement('div');
  containerEl.className = 'toast-container position-fixed bottom-0 end-0 p-3';
  containerEl.setAttribute('aria-live', 'polite');
  containerEl.setAttribute('aria-atomic', 'true');
  document.body.appendChild(containerEl);
  return containerEl;
}

const TYPE_MAP = {
  success: { icon: 'check-circle-fill', className: 'text-bg-success' },
  error: { icon: 'exclamation-octagon-fill', className: 'text-bg-danger' },
  warning: { icon: 'exclamation-triangle-fill', className: 'text-bg-warning' },
  info: { icon: 'info-circle-fill', className: 'text-bg-primary' },
};

export function showToast(message, type = 'info', { durationMs = 5000 } = {}) {
  const container = ensureContainer();
  const meta = TYPE_MAP[type] || TYPE_MAP.info;
  const id = `toast-${Date.now()}`;

  const toastEl = document.createElement('div');
  toastEl.id = id;
  toastEl.className = `toast align-items-center border-0 ${meta.className}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-${meta.icon}" aria-hidden="true"></i>
        <span>${escapeHtml(message)}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
  `;

  container.appendChild(toastEl);
  const toast = window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: durationMs });
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  toast.show();
}
