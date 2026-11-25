import {CAMPANA_25N,vigente25N} from './campana25n-domain.mjs';
export function montarCampana25N(target,{actualizado}={}){
 if(!target)return;clearTimeout(target._campanaTimer);
 const now=Date.parse(actualizado),activa=Number.isFinite(now)&&vigente25N(now);
 target.hidden=!activa;if(!activa)return;
 if(!target.childElementCount)target.innerHTML=`<article class="campana25n"><div class="campana25n-main"><p class="campana25n-date">25 DE NOVIEMBRE · DÍA NARANJA</p><h2>Únete para poner fin a las violencias hacia las mujeres</h2><p>Porta un distintivo naranja. Cada acción cuenta para construir espacios seguros, incluyentes y libres de violencia.</p><span class="campana25n-pill"><svg viewBox="0 0 48 56" aria-hidden="true"><path d="M16 5c4-5 12-5 16 0l4 12-8 15 14 19-13 4-9-15-5 15L3 50l16-25-7-8zm3 6 5 9 5-9c-2-3-8-3-10 0z" fill="currentColor"/></svg>Hoy vestimos naranja</span></div><div class="campana25n-actions"><h3>Por mujeres libres de violencias</h3><ul><li>Actúo para prevenir y erradicar las violencias</li><li>Construyo espacios seguros e incluyentes</li><li>Impulso la igualdad de oportunidades</li><li>Promuevo sus derechos humanos</li><li>Respeto su dignidad</li></ul><a href="${CAMPANA_25N.protocolo}" target="_blank" rel="noopener noreferrer">Conocer el protocolo del IMSS ↗</a><small>Acceso desde la red institucional del IMSS</small></div></article>`;
 target._campanaTimer=setTimeout(()=>{target.hidden=true;},Math.max(0,Date.parse(CAMPANA_25N.fin)-now));
}
