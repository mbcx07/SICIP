// SICIP - Catálogo completo de filtros de trámites v1.0.0
(function () {
  'use strict';

  var STATES = [
    ['BORRADOR', 'Borrador'],
    ['GENERADO', 'Generado'],
    ['PENDIENTE_ENTREGA', 'Pendiente de entrega'],
    ['RECIBIDO', 'Recibido'],
    ['EN_REVISION', 'En revisión'],
    ['VALIDADO', 'Validado'],
    ['OBSERVADO', 'Observado'],
    ['DEVUELTO', 'Devuelto'],
    ['RECHAZADO', 'Rechazado'],
    ['ENVIADO_DELEGACION', 'Enviado a Delegación'],
    ['EN_ANALISIS', 'En análisis'],
    ['EN_CRITICA', 'En crítica de nómina'],
    ['PENDIENTE_PAGO', 'Pendiente de pago'],
    ['PAGADO', 'Pagado'],
    ['CONCLUIDO', 'Concluido'],
    ['VENCIDO', 'Vencido']
  ];

  function isTramitesRoute() {
    return /^\/(mis-tramites|tramites|bandeja)(\/|$)/.test(location.pathname);
  }

  function patch() {
    if (!isTramitesRoute()) return;
    document.querySelectorAll('main select').forEach(function (select) {
      var values = Array.prototype.map.call(select.options, function (option) {
        return option.value;
      });
      if (values.indexOf('GENERADO') < 0 && values.indexOf('PENDIENTE_ENTREGA') < 0) return;
      STATES.forEach(function (state) {
        if (values.indexOf(state[0]) >= 0) return;
        var option = document.createElement('option');
        option.value = state[0];
        option.textContent = state[1];
        select.appendChild(option);
      });
    });
  }

  var timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(patch, 80);
  }

  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
