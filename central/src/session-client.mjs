// One redirect for all failed authenticated API calls, including child modules.
export function crearControlSesion({root=window,onExpire=()=>{}}={}){let expired=false;
 return {get expired(){return expired;},expire(){if(expired)return;expired=true;onExpire();try{if(root.top!==root&&root.top.SICIPCentral?.expireSession){root.top.SICIPCentral.expireSession();return;}}catch{}
  const host=root.top||root;try{host.sessionStorage.removeItem('sicip_usuario');host.sessionStorage.removeItem('sicip_matricula');}catch{}
  const el=host.document.createElement('p');el.setAttribute('role','alert');el.dataset.sessionExpired='';el.style='position:fixed;inset:0 0 auto;z-index:2147483647;margin:0;padding:18px;background:#fff4df;color:#513800;font:16px system-ui;text-align:center';el.textContent='Tu sesión venció. Te llevamos a iniciar sesión de nuevo. Los cambios ya guardados se conservan; los que no guardaste deberán capturarse otra vez.';host.document.body?.append(el);host.dispatchEvent(new host.Event('sicip:sesion-vencida'));
  host.setTimeout(()=>host.location.replace('/login?sesion=vencida'),700);
 }};}
