import {fotoPermitida} from './vacaciones-guia-domain.mjs';
export async function leerFoto(env,run,account,mat,person={}){
 const central=await run(env,'SELECT data,mime FROM fotos_perfil WHERE matricula=?',mat).first();
 if(central)return new Response(Uint8Array.from(atob(central.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':central.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 let source=[person.foto,person.fotoUrl,person.photoURL].map(fotoPermitida).find(Boolean);
 if(!source){let raw={};try{raw=await account(mat)||{};}catch{}source=[raw.foto,raw.fotoUrl,raw.fotoURL,raw.photoURL,raw.photoUrl,raw.fotoPerfil,raw.fotografia].map(fotoPermitida).find(Boolean);}
 if(!source)return new Response(null,{status:404,headers:{'Cache-Control':'private, no-store'}});
 if(source.startsWith('https:'))return new Response(null,{status:302,headers:{Location:source,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 const [head,data]=source.split(',');return new Response(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{'Content-Type':head.slice(5).split(';')[0],'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
export async function fotoAPI(request,env,{session,run,account,body,json,assert}){
 const u=await session(request,env);if(request.method==='GET'){const p=await run(env,"SELECT json FROM personas WHERE corte=(SELECT value FROM settings WHERE key='active') AND matricula=?",u.matricula).first();return leerFoto(env,run,account,u.matricula,p?JSON.parse(p.json):{});}
 assert(request.method==='PUT',405,'Método no permitido.');const d=await body(request,300000);assert(typeof d.data==='string'&&d.data.length<=280000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(d.data),400,'Selecciona una fotografía válida de hasta 200 KB.');const [header,encoded]=d.data.split(','),raw=atob(encoded),mime=header.slice(5).split(';')[0];assert(raw.length<=204800&&raw.length>12,400,'La fotografía supera 200 KB.');const valid=mime==='image/jpeg'?raw.startsWith('\xff\xd8\xff'):mime==='image/png'?raw.startsWith('\x89PNG\r\n\x1a\n'):raw.startsWith('RIFF')&&raw.slice(8,12)==='WEBP';assert(valid,400,'El archivo no es una fotografía válida.');await run(env,'INSERT INTO fotos_perfil(matricula,mime,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(matricula) DO UPDATE SET mime=excluded.mime,data=excluded.data,updated_at=excluded.updated_at',u.matricula,mime,encoded,new Date().toISOString()).run();return json({ok:true,url:'/api/perfil/foto'});
}
