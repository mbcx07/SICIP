/* Keyboard hints use the input's own associated label, never another field's label. */
(function(){
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function enhance(){document.querySelectorAll('input').forEach(input=>{
  if(['hidden','checkbox','radio','file','date','time','email'].includes(input.type))return;
  const labels=[...input.labels||[]].map(l=>l.textContent),before=input.previousElementSibling;
  if(!labels.length&&before?.tagName==='LABEL')labels.push(before.textContent);
  const own=norm(labels.join(' ')+' '+(input.getAttribute('aria-label')||'')+' '+(input.placeholder||''));
  if(input.type==='password'){input.autocomplete=/nueva|confirmar|repite/.test(own)?'new-password':'current-password';return;}
  if(/nombre/.test(own)){
   if(['number','tel'].includes(input.type))input.type='search';
   input.inputMode='text';
   if(input.autocomplete==='username')input.autocomplete='off';
   if(/^(\^)?(?:\[0-9\]|\\d)[+*{]/.test(input.pattern))input.removeAttribute('pattern');
   if(/matr/.test(own)&&input.maxLength>0&&input.maxLength<80)input.maxLength=150;
  }else if(/matricula|ej\.\s*4359/.test(own)&&['text','search'].includes(input.type)){
   input.inputMode='numeric';
   if(input.closest('form')?.querySelector('input[type=password]'))input.autocomplete='username';
  }
 });}
 let scheduled=false;function queue(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
 new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
})();
