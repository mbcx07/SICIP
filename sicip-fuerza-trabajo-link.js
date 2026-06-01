// SICIP Fuerza de Trabajo - Sidebar Link v1.0
// Inyecta un botón en el sidebar del SICIP para acceder a la Calculadora de Nivelación
(function() {
  'use strict';
  var VERSION = '1.0.0';

  function getUsuario() {
    try { var s = sessionStorage.getItem('sicip_usuario'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  }

  function patchSidebar() {
    var usuario = getUsuario();
    if (!usuario) return;
    var rol = (usuario.rol || usuario.perfil || '').toUpperCase();
    if (rol !== 'FUERZA_TRABAJO' && rol !== 'ADMIN') return;

    var sidebar = document.querySelector('nav');
    if (!sidebar) return;
    if (sidebar.querySelector('[data-sicip-ft]')) return;

    var btn = document.createElement('button');
    btn.setAttribute('data-sicip-ft', '1');
    btn.style.cssText = 'width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1rem;border:none;cursor:pointer;font-size:0.82rem;font-weight:500;color:rgba(255,255,255,0.75);background:transparent;border-left:4px solid transparent;border-radius:0 0.5rem 0.5rem 0;margin-bottom:2px;transition:all 0.12s;text-align:left;font-family:Inter,sans-serif';
    btn.innerHTML = '<span style="color:#5cff5c;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg></span><span style="flex:1;text-align:left">Calculadora de Nivelación</span>';

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      window.open('./fuerza-trabajo/calculadora-nivelacion.html?_='+Date.now(), '_blank');
    });

    btn.addEventListener('mouseenter', function() {
      this.style.background = 'rgba(39,174,96,0.15)';
      this.style.borderLeftColor = '#5cff5c';
    });
    btn.addEventListener('mouseleave', function() {
      this.style.background = 'transparent';
      this.style.borderLeftColor = 'transparent';
    });

    // Insertar en el contenedor de botones del sidebar
    var container = sidebar.querySelector('div');
    if (!container) { sidebar.appendChild(btn); return; }

    var allBtns = container.querySelectorAll('button');
    var insertAfter = null;
    for (var i = 0; i < allBtns.length; i++) {
      var txt = (allBtns[i].textContent || '').trim();
      if (txt.indexOf('Solicitudes') >= 0 || txt.indexOf('Bandeja') >= 0) {
        insertAfter = allBtns[i];
        break;
      }
    }
    if (insertAfter && insertAfter.nextSibling) {
      container.insertBefore(btn, insertAfter.nextSibling);
    } else {
      container.appendChild(btn);
    }
  }

  var tries = 0;
  function tryPatch() {
    if (tries++ > 30) return;
    var sidebar = document.querySelector('nav');
    if (sidebar && sidebar.querySelector('button') && !sidebar.querySelector('[data-sicip-ft]')) {
      patchSidebar();
      return;
    }
    if (!sidebar || !sidebar.querySelector('[data-sicip-ft]')) {
      setTimeout(tryPatch, 500);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryPatch, 300);
  } else {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryPatch, 300); });
  }
})();
