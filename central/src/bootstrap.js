(function(){
  'use strict';
  const nativeFetch=window.fetch.bind(window);
  window.SICIPCentralBoot=import('/sicip-central/client.mjs?v=20261023-central-1').then(m=>m.init(nativeFetch));
  const files=/^\/data-(?:trabajadores|plazas(?:-full)?(?:-\d{7})?|vacantes|jefesServicio|ft-(?:trabajadores|nomina-\d{7}|antiguedad|clasificacion))\.json$/;
  window.fetch=function(input,options){
    const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
    if(url.origin===location.origin&&files.test(url.pathname)&&(!options?.method||options.method==='GET'))return window.SICIPCentralBoot.then(()=>window.SICIPCentral.legacyFetch(url));
    return nativeFetch(input,options);
  };
})();
