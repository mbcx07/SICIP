/* SICIP v5.13 - Remediación post-auditoría: accesibilidad, seguridad cliente y UX institucional */
(function(){
  'use strict';
  var VERSION='5.13.2-loginfix-20260612';
  var STYLE_ID='sicip-auditfix-style';
  var SENSITIVE_KEYS=['password','passwordHash','token','secret','apiSecret','refreshToken','accessToken'];

  function css(){
    if(document.getElementById(STYLE_ID)) return;
    var s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      :root{--sicip-green:#005235;--sicip-green-2:#0b6b47;--sicip-focus:#f59e0b;--sicip-danger:#b91c1c;--sicip-muted:#374151;}
      *:focus-visible{outline:3px solid var(--sicip-focus)!important;outline-offset:2px!important;box-shadow:0 0 0 3px rgba(245,158,11,.25)!important;}
      button,a,input,select,textarea{min-height:38px;}
      button[aria-label],a[aria-label]{position:relative;}
      #sicip-version-badge{background:#064e3b!important;color:#fff!important;border-color:#064e3b!important;}
      [style*="#9ca3af"],[style*="rgb(156, 163, 175)"]{color:#4b5563!important;}
      [style*="#999"],[style*="rgb(153, 153, 153)"]{color:#4b5563!important;}
      span[style*="#d97706"],div[style*="#d97706"]{color:#92400e!important;}
      .sicip-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;}
      .sicip-security-banner{background:#fff7ed;border:1px solid #fed7aa;color:#7c2d12;border-radius:12px;padding:10px 14px;margin:10px 0;font-size:13px;line-height:1.35;}
      @media(max-width:640px){
        main,section{max-width:100vw!important;}
        table{font-size:12px!important;}
        th,td{padding:8px!important;}
        input,select,textarea,button{font-size:16px!important;}
        [style*="grid-template-columns"]{grid-template-columns:1fr!important;}
      }
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important;}}
    `;
    document.head.appendChild(s);
  }

  function textOf(el){return (el.innerText||el.textContent||el.value||el.placeholder||el.title||'').trim();}
  function humanize(s){return String(s||'').replace(/([A-Z])/g,' $1').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();}
  function nearestText(el){
    var p=el.parentElement;
    for(var i=0;p&&i<3;i++,p=p.parentElement){
      var t=(p.innerText||'').trim().split('\n').map(function(x){return x.trim();}).filter(Boolean)[0];
      if(t&&t.length<80) return t;
    }
    return '';
  }
  function labelControl(el){
    if(el.disabled) return;
    var tag=el.tagName.toLowerCase();
    var type=(el.getAttribute('type')||'').toLowerCase();
    if(tag==='input' && ['hidden','submit','button'].indexOf(type)>=0) return;
    var label='';
    if(el.id){
      try{ label=(document.querySelector('label[for="'+CSS.escape(el.id)+'"]')||{}).innerText||''; }catch(e){}
    }
    label=label||el.getAttribute('aria-label')||el.getAttribute('title')||el.placeholder||el.name||el.id||nearestText(el)||tag;
    label=humanize(label);
    if(!el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
    if(!el.id) el.id='sicip-field-'+Math.random().toString(36).slice(2,9);
  }
  function labelButtons(){
    document.querySelectorAll('button,a,[role="button"]').forEach(function(el){
      var t=textOf(el);
      if(!t){
        var label=el.getAttribute('title')||el.getAttribute('aria-label')||nearestText(el)||'Acción SICIP';
        if(el.closest('header')) label='Abrir menú o acción de encabezado';
        el.setAttribute('aria-label',humanize(label));
        if(!el.title) el.title=humanize(label);
      }
      if(el.tagName.toLowerCase()==='button' && !el.getAttribute('type')) el.setAttribute('type','button');
    });
  }
  function fixScrollable(){
    document.querySelectorAll('div,section,main').forEach(function(el){
      var st=getComputedStyle(el);
      if((st.overflowX==='auto'||st.overflowX==='scroll'||st.overflowY==='auto'||st.overflowY==='scroll') && el.tabIndex<0){
        el.tabIndex=0;
        if(!el.getAttribute('aria-label')) el.setAttribute('aria-label','Región desplazable');
      }
    });
  }
  function redactObject(obj){
    if(!obj||typeof obj!=='object') return obj;
    if(Array.isArray(obj)) return obj.map(redactObject);
    var out={};
    Object.keys(obj).forEach(function(k){
      if(SENSITIVE_KEYS.indexOf(k)>=0 || /password|token|secret/i.test(k)) return;
      out[k]=redactObject(obj[k]);
    });
    return out;
  }
  function hardenStorage(){
    ['sicip_usuario'].forEach(function(k){
      try{ var raw=sessionStorage.getItem(k); if(!raw) return; var clean=redactObject(JSON.parse(raw)); sessionStorage.setItem(k,JSON.stringify(clean)); }catch(e){}
    });
    try{ Object.keys(localStorage).forEach(function(k){ if(/password|token|secret/i.test(k)) localStorage.removeItem(k); }); }catch(e){}
  }
  function patchFetchRedaction(){ /* v5.13.2: desactivado para no interferir login/Firestore */ }
  function fixVersionBadge(){
    var b=document.getElementById('sicip-version-badge');
    if(b && /4\.0\.1|4\.01|v4|5\.13\.1|v5\.13|5\.15(?!\.1)/i.test(b.textContent||'')){
      b.textContent='SICIP v5.15.1';
      b.title='SICIP v5.15.1 · Click para forzar recarga';
    }
  }
  function addSecurityBanner(){
    if(document.querySelector('.sicip-security-banner')) return;
    if(!/\/admin|\/plantilla|\/pases|\/fuerza-trabajo/.test(location.pathname)) return;
    var host=document.querySelector('main')||document.body;
    var b=document.createElement('div');
    b.className='sicip-security-banner';
    b.setAttribute('role','status');
    b.innerHTML='<strong>Modo reforzado SICIP:</strong> validaciones de accesibilidad, redacción de datos sensibles en cliente y mejoras responsive activas. Las operaciones críticas deben auditarse antes de cierre institucional.';
    host.insertBefore(b,host.firstChild);
  }
  function run(){css(); fixVersionBadge(); labelButtons(); document.querySelectorAll('input,select,textarea').forEach(labelControl); fixScrollable(); hardenStorage(); addSecurityBanner();}
  patchFetchRedaction();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  var mo=new MutationObserver(function(){ clearTimeout(window.__sicipAuditFixTimer); window.__sicipAuditFixTimer=setTimeout(run,250); });
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(hardenStorage,3000);
  console.log('[SICIP] Remediación post-auditoría activa',VERSION);
})();
