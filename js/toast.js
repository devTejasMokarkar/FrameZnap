(function () {
  const CONTAINER_ID = 'toast-container';
  const TOAST_TYPES = {
    success: { icon: '✓', class: 'toast-success' },
    error: { icon: '✕', class: 'toast-error' },
    warning: { icon: '⚠', class: 'toast-warning' },
    info: { icon: 'ℹ', class: 'toast-info' },
  };

  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 400px;
      width: calc(100% - 2rem);
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.45;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      word-break: break-word;
      position: relative;
      border-left: 4px solid transparent;
    }
    .toast.show {
      transform: translateX(0);
      opacity: 1;
    }
    .toast-close {
      background: none;
      border: none;
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      opacity: 0.5;
      padding: 0;
      margin-left: auto;
      flex-shrink: 0;
      transition: opacity 0.2s;
      color: inherit;
    }
    .toast-close:hover { opacity: 1; }
    .toast-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
    .toast-body { flex: 1; min-width: 0; }
    .toast-title { font-weight: 600; margin-bottom: 0.15rem; }
    .toast-success { background: #ecfdf5; color: #065f46; border-color: #10b981; }
    .toast-error { background: #fef2f2; color: #991b1b; border-color: #ef4444; }
    .toast-warning { background: #fffbeb; color: #92400e; border-color: #f59e0b; }
    .toast-info { background: #eff6ff; color: #1e40af; border-color: #3b82f6; }
  `;
  document.head.appendChild(style);

  function getContainer() {
    let el = document.getElementById(CONTAINER_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = CONTAINER_ID;
      document.body.appendChild(el);
    }
    return el;
  }

  function createToast(message, type, title, duration) {
    const cfg = TOAST_TYPES[type] || TOAST_TYPES.info;
    const container = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${cfg.class}`;
    toast.innerHTML = `
      <span class="toast-icon">${cfg.icon}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div>${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;
    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }
    return toast;
  }

  function dismiss(toast) {
    if (!toast || toast.classList.contains('removing')) return;
    toast.classList.remove('show');
    toast.classList.add('removing');
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  }

  window.Toast = {
    success: (msg, title, duration) => createToast(msg, 'success', title, duration ?? 4000),
    error: (msg, title, duration) => createToast(msg, 'error', title, duration ?? 6000),
    warning: (msg, title, duration) => createToast(msg, 'warning', title, duration ?? 5000),
    info: (msg, title, duration) => createToast(msg, 'info', title, duration ?? 4000),
    dismiss: dismiss,
  };
})();
