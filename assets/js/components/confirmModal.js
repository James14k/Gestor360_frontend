import { escapeHtml } from '../utils/dom.js';

let modalEl = null;
let modalInstance = null;
let resolvePromise = null;

function ensureModal() {
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.className = 'modal fade';
  modalEl.id = 'appConfirmModal';
  modalEl.tabIndex = -1;
  modalEl.setAttribute('aria-labelledby', 'appConfirmModalLabel');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="appConfirmModalLabel">Confirmar acción</h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body" id="appConfirmModalBody"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-confirm-cancel data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-danger" data-confirm-ok>Confirmar</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);
  modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);

  modalEl.querySelector('[data-confirm-ok]').addEventListener('click', () => {
    modalInstance.hide();
    if (resolvePromise) resolvePromise(true);
  });

  modalEl.querySelector('[data-confirm-cancel]').addEventListener('click', () => {
    if (resolvePromise) resolvePromise(false);
  });

  modalEl.addEventListener('hidden.bs.modal', () => {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  });

  return modalEl;
}

/**
 * @returns {Promise<boolean>}
 */
export function confirmAction({
  title = 'Confirmar acción',
  message = '¿Deseas continuar?',
  confirmLabel = 'Confirmar',
  confirmClass = 'btn-danger',
} = {}) {
  const el = ensureModal();
  el.querySelector('#appConfirmModalLabel').textContent = title;
  el.querySelector('#appConfirmModalBody').innerHTML = `<p class="mb-0">${escapeHtml(message)}</p>`;

  const okBtn = el.querySelector('[data-confirm-ok]');
  okBtn.textContent = confirmLabel;
  okBtn.className = `btn ${confirmClass}`;

  return new Promise((resolve) => {
    resolvePromise = resolve;
    modalInstance.show();
  });
}
