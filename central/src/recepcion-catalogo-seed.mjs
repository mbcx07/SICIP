import base from './recepcion-catalogo-base.json' with {type:'json'};
import {searchKey} from './domain.mjs';
export function catalogoInicial(){return base.flatMap((g,i)=>g.documentos.map((nombre,j)=>({id:'base-'+i+'-'+j,clave:searchKey(g.categoria+'|'+nombre),categoria:g.categoria,nombre,orden:i*100+j})));}
export async function seedCatalogo(DB){for(const r of catalogoInicial())await DB.prepare('INSERT INTO recepcion_catalogo(id,clave,categoria,nombre,orden,actor,fecha) VALUES(?,?,?,?,?,?,?) ON CONFLICT(clave) DO NOTHING').bind(r.id,r.clave,r.categoria,r.nombre,r.orden,'SISTEMA',new Date().toISOString()).run();}
