(function(){
 'use strict';if(window.SICIPPasesSync)return;
 var personal=['ADMIN','ADMINISTRADOR','AREA_PERSONAL','FUERZA_TRABAJO'];
 async function sync(p,options){await window.SICIPCentralBoot;var api=window.SICIPCentral.api,remote;try{remote=await api('/api/pases/registros?folio='+encodeURIComponent(p.folio));}catch(e){if(e.status!==404)throw e;}
  if(remote&&!options?.update)return remote;
  var state=p.estado||'PENDIENTE_ENTREGA';if(!remote&&state==='RECIBIDO_PERSONAL'&&!personal.includes(window.SICIPCentral.user.rol))state='PENDIENTE_ENTREGA';
  var context=window.SICIPPasesContexto?.()||{modo_personal:false};var saved=await api('/api/pases/registros',{method:'POST',body:JSON.stringify({...p,...context,estado:state})});if(window.SICIPPasesVisibles&& (await window.SICIPCentral.filtrarDocumentos([{...p,...saved}])).length)window.SICIPPasesVisibles.add(saved.folio);return {...p,...saved};
 }
 async function refresh(){await window.SICIPCentralBoot;var store=window.SICIPPasesStorage;if(!store)return;var after='',rows=[];do{var data=await window.SICIPCentral.api('/api/pases/registros'+(after?'?after='+encodeURIComponent(after):''));rows.push(...data.pases);after=data.next;}while(after);var map=new Map(store.read().map(p=>[p.folio,p]));rows.forEach(p=>map.set(p.folio,{...map.get(p.folio),...p}));var visibles=await window.SICIPCentral.filtrarDocumentos(Array.from(map.values()));window.SICIPPasesVisibles=new Set(visibles.map(p=>p.folio));store.write(Array.from(map.values()));window.dispatchEvent(new Event('sicip:pases-updated'));return rows;
 }
 window.SICIPPasesSync={sync:sync,refresh:refresh};
})();
