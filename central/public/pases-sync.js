(function(){
 'use strict';if(window.SICIPPasesSync)return;
 function personalMode(){return new URLSearchParams(location.search).get('scope')==='personal'&&['ADMIN','ADMINISTRADOR','AREA_PERSONAL','FUERZA_TRABAJO'].includes(window.SICIPCentral?.user?.rol);}
 var personal=['ADMIN','ADMINISTRADOR','AREA_PERSONAL','FUERZA_TRABAJO'];
 async function sync(p,options){await window.SICIPCentralBoot;var api=window.SICIPCentral.api,remote;try{remote=await api('/api/pases/registros?folio='+encodeURIComponent(p.folio)+'&scope='+(personalMode()?'personal':'propio'));}catch(e){if(e.status!==404)throw e;}
  if(remote&&!options?.update)return remote;
  var state=p.estado||'PENDIENTE_ENTREGA';if(!remote&&state==='RECIBIDO_PERSONAL'&&!personal.includes(window.SICIPCentral.user.rol))state='PENDIENTE_ENTREGA';
  var context=window.SICIPPasesContexto?.()||{modo_personal:false};var saved=await api('/api/pases/registros',{method:'POST',body:JSON.stringify({...p,...context,estado:state})});if(window.SICIPPasesVisibles&&(personalMode()||String(saved.matricula)===String(window.SICIPCentral.user.matricula)))window.SICIPPasesVisibles.add(saved.folio);return {...p,...saved};
 }
 var refreshVersion=0;async function refresh(){var version=++refreshVersion;await window.SICIPCentralBoot;var store=window.SICIPPasesStorage;if(!store)return;var after='',rows=[],isPersonal=personalMode(),unit='';if(isPersonal){try{unit=window.SICIPPasesContexto?.().unidad_clave||'';}catch{return;}if(!unit)unit=(await window.SICIPCentral.api('/api/pases/unidad-preferida')).unidad?.clave||'';}do{var q=new URLSearchParams({scope:isPersonal?'personal':'propio',...(unit?{unidad:unit}:{}),...(after?{after}:{})});var data=await window.SICIPCentral.api('/api/pases/registros?'+q);rows.push(...data.pases);after=data.next;}while(after);if(version!==refreshVersion)return rows;var map=new Map(store.read().map(p=>[p.folio,p]));rows.forEach(p=>map.set(p.folio,{...map.get(p.folio),...p}));var visibles=isPersonal?rows:rows.filter(p=>String(p.matricula)===String(window.SICIPCentral.user.matricula));window.SICIPPasesVisibles=new Set(visibles.map(p=>p.folio));store.write(Array.from(map.values()));window.dispatchEvent(new Event('sicip:pases-updated'));return visibles;
 }
 window.SICIPPasesSync={sync:sync,refresh:refresh};
})();
