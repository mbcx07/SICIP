importScripts('/sicip-central/vendor/xlsx.full.min.js');
self.onmessage=async function(event){try{
 const {parseWorkbook}=await import('/sicip-central/domain.mjs');
 const {buffer,quincena,source_name}=event.data;
 const source_hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const book=XLSX.read(buffer,{type:'array',cellDates:true});
 const snapshot=parseWorkbook(book,XLSX,quincena);
 self.postMessage({snapshot:{...snapshot,source_hash,source_name}});
 }catch(e){self.postMessage({error:e.message||'No se pudo leer el archivo.'});}};
