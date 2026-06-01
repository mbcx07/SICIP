/* SICIP UX runtime fixes - no cambia lógica de negocio */
(function(){
  function normalizeText(root){
    var walker=document.createTreeWalker(root||document.body, NodeFilter.SHOW_TEXT);
    var n;
    while((n=walker.nextNode())){
      if(n.nodeValue && n.nodeValue.trim()==='x Vencer') n.nodeValue='Por vencer';
    }
  }
  function enhanceInputs(){
    var inputs=[].slice.call(document.querySelectorAll('input'));
    inputs.forEach(function(input){
      var label='';
      var parent=input.closest('div');
      if(parent){
        var l=parent.querySelector('label');
        if(l) label=l.textContent.toLowerCase();
      }
      var ph=(input.getAttribute('placeholder')||'').toLowerCase();
      if(input.type==='password'){
        if(label.indexOf('nueva')>=0 || label.indexOf('confirmar')>=0 || ph.indexOf('nueva')>=0 || ph.indexOf('repite')>=0) input.setAttribute('autocomplete','new-password');
        else input.setAttribute('autocomplete','current-password');
      }
      if(label.indexOf('matr')>=0 || ph.indexOf('4359')>=0){
        input.setAttribute('autocomplete','username');
        input.setAttribute('inputmode','numeric');
      }
    });
  }
  function run(){ normalizeText(document.body); enhanceInputs(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
  new MutationObserver(function(){ run(); }).observe(document.documentElement,{childList:true,subtree:true});
})();
