// Keep the paper layout intact; scale only its on-screen preview.
export function documentoAdaptable(html){
 const width=/size\s*:\s*letter\s+landscape/i.test(html)?1056:816;
 const extra=`<meta name="viewport" content="width=device-width, initial-scale=1"><style>@media screen{html{margin:0!important;padding:0!important;background:#edf2ef!important}body{margin:0!important;padding:0!important;width:100%!important;max-width:none!important;overflow-x:hidden!important}#sicip-paper{box-sizing:border-box;width:${width}px;padding:20px;background:white;transform-origin:top left;overflow:visible}#sicip-paper *{box-sizing:border-box}}@media print{#sicip-paper{width:auto!important;padding:0!important;transform:none!important}body{height:auto!important}}</style>`;
 const script=`<script>(()=>{const paper=document.getElementById('sicip-paper');function fit(){if(matchMedia('print').matches)return;const scale=Math.min(1,document.documentElement.clientWidth/${width});paper.style.transform='scale('+scale+')';document.body.style.height=Math.ceil(paper.scrollHeight*scale)+'px';}new ResizeObserver(fit).observe(paper);addEventListener('resize',fit);addEventListener('load',fit);document.fonts?.ready.then(fit);fit();})();<\/script>`;
 const doc=new DOMParser().parseFromString(html,'text/html');doc.head.insertAdjacentHTML('beforeend',extra);const paper=doc.createElement('div');paper.id='sicip-paper';paper.append(...doc.body.childNodes);doc.body.append(paper);doc.body.insertAdjacentHTML('beforeend',script);return '<!doctype html>'+doc.documentElement.outerHTML;
}
export function mostrarDocumento(html,{titulo='Vista de impresión'}={}){
 const host=window.top?.document||document;const d=host.createElement('dialog');d.className='coverage-print-dialog sicip-document-viewer';
 d.innerHTML='<header><h2></h2><div class="coverage-actions"><button type="button" data-print>Imprimir / guardar PDF</button><button type="button" data-close>Cerrar</button></div></header><p data-help>Revisa el documento y selecciona imprimir para guardarlo como PDF o enviarlo a tu impresora.</p><iframe></iframe><p role="status" data-status></p>';
 d.querySelector('h2').textContent=titulo;const f=d.querySelector('iframe');f.title=titulo;f.srcdoc=documentoAdaptable(html);let ready=false;const print=d.querySelector('[data-print]');print.disabled=true;f.onload=()=>{ready=true;print.disabled=false;};
 print.onclick=()=>{if(!ready)return;try{f.contentWindow.focus();f.contentWindow.print();}catch{d.querySelector('[data-status]').textContent='No se pudo abrir la impresión. Intenta desde el navegador del dispositivo.';}};
 d.querySelector('[data-close]').onclick=()=>d.close();d.onclose=()=>d.remove();host.body.append(d);d.showModal();return d;
}
