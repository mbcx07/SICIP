// SICIP - Módulo Herramientas Sidebar v1.2
// Inserta el módulo "Herramientas" como lista desplegable y carga submódulos dentro del SICIP.
(function() {
  'use strict';
  var VERSION = '1.2.0';

  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }

  function rolNorm(usuario) {
    return String((usuario && (usuario.rol || usuario.perfil || usuario.role)) || '')
      .toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_');
  }

  function puedeVerHerramientas(usuario) {
    return ['FUERZA_TRABAJO','FUERZADETRABAJO','ADMIN','ADMINISTRADOR'].indexOf(rolNorm(usuario)) >= 0;
  }

  function btnBase() {
    return 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1rem;border:none;cursor:pointer;font-size:0.82rem;font-weight:500;color:rgba(255,255,255,0.78);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
  }

  function setHover(btn) {
    btn.addEventListener('mouseenter', function() {
      this.style.background = 'rgba(39,174,96,0.15)';
      this.style.borderLeftColor = '#5cff5c';
    });
    btn.addEventListener('mouseleave', function() {
      if (this.getAttribute('aria-expanded') !== 'true' && !this.dataset.active) {
        this.style.background = 'transparent';
        this.style.borderLeftColor = 'transparent';
      }
    });
  }

  function findMainContainer() {
    return document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('#root main') || document.querySelector('#app main') || document.body;
  }

  function closeHerramientas() {
    var main = findMainContainer();
    var view = document.getElementById('sicip-herramientas-view');
    if (view) view.remove();
    if (main) {
      Array.prototype.forEach.call(main.children, function(child) {
        child.style.display = child.dataset.sicipPrevDisplay || '';
        delete child.dataset.sicipPrevDisplay;
      });
    }
    var active = document.querySelector('[data-sicip-herramientas-sub]');
    if (active) {
      active.dataset.active = '';
      active.style.background = 'transparent';
      active.style.borderLeftColor = 'transparent';
    }
  }

  function mountCalculadora() {
    var main = findMainContainer();
    if (!main) return;

    closeHerramientas();

    Array.prototype.forEach.call(main.children, function(child) {
      if (child.id !== 'sicip-herramientas-view') {
        child.dataset.sicipPrevDisplay = child.style.display || '';
        child.style.display = 'none';
      }
    });

    var view = document.createElement('section');
    view.id = 'sicip-herramientas-view';
    view.style.cssText = 'padding:0;margin:0;width:100%;min-height:calc(100vh - 24px);background:#f5f7f6';
    view.innerHTML = '' +
      '<iframe title="Calculadora de Nivelación" src="./fuerza-trabajo/calculadora-nivelacion.html?embed=1&_=' + Date.now() + '" style="width:100%;height:calc(100vh - 24px);min-height:760px;border:0;border-radius:0;background:#f5f7f6;display:block"></iframe>';

    main.appendChild(view);
  }

  function patchSidebar() {
    var usuario = getUsuario();
    if (!puedeVerHerramientas(usuario)) return;

    var sidebar = document.querySelector('nav');
    if (!sidebar) return;
    if (sidebar.querySelector('[data-sicip-herramientas-root]')) return;

    var wrapper = document.createElement('div');
    wrapper.setAttribute('data-sicip-herramientas-root', '1');
    wrapper.style.cssText = 'width:100%;margin-bottom:2px';

    var btn = document.createElement('button');
    btn.setAttribute('data-sicip-herramientas-toggle', '1');
    btn.setAttribute('aria-expanded', 'false');
    btn.style.cssText = btnBase();
    btn.innerHTML = '<span style="color:#5cff5c;flex-shrink:0">🧰</span><span style="flex:1;text-align:left">Herramientas</span><span data-caret style="opacity:.75">▸</span>';
    setHover(btn);

    var submenu = document.createElement('div');
    submenu.setAttribute('data-sicip-herramientas-menu', '1');
    submenu.style.cssText = 'display:none;margin:0 0 4px 20px;padding-left:10px;border-left:1px solid rgba(255,255,255,.18)';

    var sub = document.createElement('button');
    sub.setAttribute('data-sicip-herramientas-sub', 'calculadora-nivelacion');
    sub.style.cssText = btnBase() + ';font-size:0.78rem;padding:0.55rem 0.75rem;color:rgba(255,255,255,0.72)';
    sub.innerHTML = '<span style="color:#a7f3d0;flex-shrink:0">🧮</span><span style="flex:1;text-align:left">Calculadora de Nivelación</span>';
    setHover(sub);

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      submenu.style.display = open ? 'none' : 'block';
      var caret = btn.querySelector('[data-caret]');
      if (caret) caret.textContent = open ? '▸' : '▾';
      btn.style.background = open ? 'transparent' : 'rgba(39,174,96,0.15)';
      btn.style.borderLeftColor = open ? 'transparent' : '#5cff5c';
    });

    sub.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      sub.dataset.active = '1';
      sub.style.background = 'rgba(39,174,96,0.22)';
      sub.style.borderLeftColor = '#5cff5c';
      mountCalculadora();
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(submenu);
    submenu.appendChild(sub);

    var container = sidebar.querySelector('div');
    if (!container) { sidebar.appendChild(wrapper); return; }

    var allBtns = container.querySelectorAll('button');
    var insertAfter = null;
    for (var i = 0; i < allBtns.length; i++) {
      var txt = (allBtns[i].textContent || '').trim();
      if (txt.indexOf('Solicitudes') >= 0 || txt.indexOf('Bandeja') >= 0 || txt.indexOf('Reportes') >= 0) {
        insertAfter = allBtns[i];
      }
    }
    if (insertAfter && insertAfter.nextSibling) {
      container.insertBefore(wrapper, insertAfter.nextSibling);
    } else {
      container.appendChild(wrapper);
    }
  }


  // Si el usuario toca cualquier otro módulo del sidebar, cerrar la vista embebida
  // para que la navegación normal de SICIP no quede atrapada en Herramientas.
  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-sicip-herramientas-root]')) return;
    if (e.target.closest('nav button, nav a, aside button, aside a')) {
      closeHerramientas();
    }
  }, true);

  window.addEventListener('popstate', closeHerramientas);
  window.addEventListener('hashchange', closeHerramientas);

  var tries = 0;
  function tryPatch() {
    if (tries++ > 40) return;
    var sidebar = document.querySelector('nav');
    if (sidebar && sidebar.querySelector('button') && !sidebar.querySelector('[data-sicip-herramientas-root]')) {
      patchSidebar();
      return;
    }
    if (!sidebar || !sidebar.querySelector('[data-sicip-herramientas-root]')) setTimeout(tryPatch, 500);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryPatch, 300);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryPatch, 300); });
  }
})();
