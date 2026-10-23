(function(){
 'use strict';var owner='',names=new Map(),loading=false,timer;
 function key(s){return String(s||'').replace(/\s+/g,' ').trim();}
 async function sync(){var central=window.SICIPCentral;if(!central?.user||!document.querySelector('nav.sidebar'))return;
  var profile=document.querySelector('.sicip-flow-profile h3');if(profile){try{var session=JSON.parse(sessionStorage.getItem('sicip_usuario')||'null'),shown=window.SICIPNombre(session?.nombre||central.user.nombre);if(profile.textContent!==shown)profile.textContent=shown;}catch{}}
  if(owner!==central.user.matricula&&!loading){loading=true;try{var data=await central.load();names.clear();data.personas.forEach(function(p){var raw=key(p.nombre),display=window.SICIPNombre(raw);if(raw!==display){names.set(raw,display);names.set(key(raw.replace(/\//g,' ')),display);}});owner=central.user.matricula;}catch{}finally{loading=false;}}
  if(!names.size)return;var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),node;
  while((node=walker.nextNode())){if(node.parentElement?.closest('script,style,textarea,input,[contenteditable=true]'))continue;var text=key(node.nodeValue),replacement=names.get(text);if(!replacement){var match=text.match(/^(Nombre|Trabajador|Jefe de servicio|Jefe de dependencia):\s*(.+)$/i);if(match&&names.has(match[2]))replacement=match[1]+': '+names.get(match[2]);}if(replacement&&text!==replacement)node.nodeValue=node.nodeValue.replace(node.nodeValue.trim(),replacement);}
 }
 new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(sync,150);}).observe(document.documentElement,{childList:true,subtree:true});setInterval(sync,1500);sync();
})();
