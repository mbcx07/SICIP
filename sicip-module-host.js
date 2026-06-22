// SICIP - Coordinador único de módulos embebidos v1.1.0
(function () {
  'use strict';

  var CUSTOM_SELECTOR = '#sicip-pases-view,#sicip-herramientas-view,[data-sicip-cr-panel],[data-sicip-recepciones-panel]';

  function main() {
    return document.querySelector('main') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('#root main') ||
      document.body;
  }

  function clearActive() {
    var buttons = document.querySelectorAll(
      'nav button,nav a,aside button,aside a,[data-sicip-active],[data-active]'
    );
    Array.prototype.forEach.call(buttons, function (button) {
      button.removeAttribute('data-sicip-active');
      if (button.dataset) button.dataset.active = '';
      if (button.closest('nav,aside')) {
        button.style.background = button.dataset && button.dataset.sub
          ? 'rgba(255,255,255,0.05)'
          : 'transparent';
        button.style.borderLeftColor = button.dataset && button.dataset.sub
          ? 'rgba(167,243,208,0.4)'
          : 'transparent';
      }
    });
  }

  function restore() {
    var container = main();
    // Eliminar TODOS los módulos embebidos antes de montar uno nuevo
    document.querySelectorAll(CUSTOM_SELECTOR).forEach(function (node) {
      node.remove();
    });
    // También limpiar cualquier panel con data-sicip-host-hidden que pudiera haber quedado
    document.querySelectorAll('[data-sicip-host-hidden="1"]').forEach(function (node) {
      node.style.display = node.dataset.sicipHostDisplay || '';
      delete node.dataset.sicipHostHidden;
      delete node.dataset.sicipHostDisplay;
    });
    if (!container) return;
    Array.prototype.forEach.call(container.children, function (child) {
      if (child.dataset.sicipHostHidden === '1') {
        child.style.display = child.dataset.sicipHostDisplay || '';
        delete child.dataset.sicipHostHidden;
        delete child.dataset.sicipHostDisplay;
      }
      // Limpiar marcas de los cargadores anteriores para evitar restauraciones tardías.
      delete child.dataset.sicipPasesPrevDisplay;
      delete child.dataset.sicipPrevDisplay;
    });
  }

  function activate(button) {
    clearActive();
    if (!button) return;
    button.setAttribute('data-sicip-active', '1');
    if (button.dataset) button.dataset.active = '1';
    button.style.background = 'rgba(39,174,96,0.30)';
    button.style.borderLeftColor = '#5cff5c';
  }

  function mount(node, button) {
    var container = main();
    if (!container || !node) return;
    restore();
    Array.prototype.forEach.call(container.children, function (child) {
      if (child !== node && !child.matches(CUSTOM_SELECTOR)) {
        child.dataset.sicipHostDisplay = child.style.display || '';
        child.dataset.sicipHostHidden = '1';
        child.style.display = 'none';
      }
    });
    container.appendChild(node);
    activate(button);
  }

  function showReact() {
    restore();
    clearActive();
  }

  // Toda navegación normal de React cierra primero cualquier módulo embebido.
  // Usar capture phase para interceptar antes de que React procese el clic.
  document.addEventListener('click', function (event) {
    var target = event.target.closest('nav button,nav a,aside button,aside a');
    if (!target || target.closest('[data-sicip-custom-nav]')) return;
    showReact();
  }, true);

  window.addEventListener('popstate', showReact);
  window.addEventListener('hashchange', showReact);

  // Exponer restore globalmente para que otros módulos puedan llamarlo
  window.__SICIP_RESTORE__ = restore;

  window.SICIPModuleHost = {
    version: '1.1.0',
    main: main,
    mount: mount,
    restore: restore,
    showReact: showReact,
    activate: activate,
    clearActive: clearActive
  };
})();
