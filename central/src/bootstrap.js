(function(){
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  window.SICIPCentralBoot=import('/sicip-central/client.mjs?v=20261024-madrereal1').then(m=>m.init(nativeFetch));
  if(!/^\/(pases|fuerza-trabajo|examenes)(?:\/|$)/.test(location.pathname))window.SICIPCentralBoot.then(()=>new Promise((resolve,reject)=>{if(window.qrcode)return resolve();const script=document.createElement('script');script.src='/sicip-central/vendor/qrcode.js';script.onload=resolve;script.onerror=()=>reject(new Error('No se pudo cargar el generador QR.'));document.head.appendChild(script);})).then(()=>import('/sicip-central/contratacion-client.mjs?v=20261024-madrereal1')).catch(error=>console.error('No se pudo iniciar Contratación:',error.message));
  const files=/^\/data-(?:trabajadores|plazas(?:-full)?(?:-\d{7})?|vacantes|jefesServicio|ft-(?:trabajadores|nomina-\d{7}|antiguedad|clasificacion))\.json$/;
  window.fetch=function(input,options){
    const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
    if(url.origin===location.origin&&files.test(url.pathname)&&(!options?.method||options.method==='GET'))return window.SICIPCentralBoot.then(()=>window.SICIPCentral.legacyFetch(url));
    return nativeFetch(input,options);
  };
})();
