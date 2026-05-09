# 🔩 IronMind - Diagnóstico de Rendimiento SICIP

**Módulo:** Cuadro de Reemplazo  
**Fecha:** 2025-05-08  
**Analista:** IronMind (soldado de optimización)

---

## 📋 Problemas Identificados

### 🔴 PROBLEMA 1: N+1 Query Problem (CRÍTICO)
**Ubicación:** `CuadrosScreen.tsx` líneas 71-78

```typescript
const plazasData = usuario.rol === Rol.ADMIN ? await getPlazasTodas() : await getPlazasPorJefe(usuario.uid);
setPlazas(plazasData);
const resultados: Record<string, CuadroReemplazo | null> = {};
await Promise.all(plazasData.map(async (p) => {
  try { resultados[p.id] = await getCuadroPorPlaza(p.id); } catch { resultados[p.id] = null; }
}));
setCuadros(resultados);
```

**Causa raíz:** Por cada plaza se hace una consulta Firestore independiente.  
**Impacto:** 50 plazas = 51 consultas Firestore. Lento y costoso.

---

### 🔴 PROBLEMA 2: Búsqueda de trabajadores ineficiente (CRÍTICO)
**Ubicación:** `reemplazos.ts` función `buscarTrabajadores`

```typescript
export async function buscarTrabajadores(termino: string): Promise<...[]> {
  const snap = await getDocs(
    query(collection(db, 'trabajadores'), limit(20))  // ← Trae 20 ALEATORIOS
  );
  return snap.docs
    .map(d => d.data())
    .filter(t =>
      t.matricula?.includes(termino) ||
      (`${t.nombre} ${t.apellidoPaterno} ${t.apellidoMaterno}`).toLowerCase().includes(termino.toLowerCase())
    )
```

**Causa raíz:** Trae 20 documentos aleatorios y filtra en cliente. No hay índice Firestore para búsqueda por matrícula o nombre.  
**Impacto:** Si buscas "MARIA" y los 20 primeros no contienen "MARIA", no encuentra resultados aunque existan trabajadores llamados "MARIA".

---

### 🟠 PROBLEMA 3: getCuadrosPorJefe sin filtro real
**Ubicación:** `reemplazos.ts` función `getCuadrosPorJefe`

```typescript
export async function getCuadrosPorJefe(jefeUid: string): Promise<CuadroReemplazo[]> {
  const q = query(
    collection(db, 'cuadros_reemplazo'),
    orderBy('fechaCreacion', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  // Filtrar lado cliente por ahora (requiere join con plazas)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CuadroReemplazo));
}
```

**Causa raíz:** No hay forma de filtrar por jefe en Firestore porque `jefeUid` está en la plaza, no en el cuadro. Trae 100 registros y filtra en cliente.  
**Impacto:** Consultas innecesarias de datos que no se usarán.

---

### 🟠 PROBLEMA 4: validarCandidate carga TODAS las ternas
**Ubicación:** `reemplazos.ts` función `validarCandidato`

```typescript
const ternasActivas = await getDocs(query(collection(db, 'cuadros_reemplazo'), where('status', 'in', ['BORRADOR', 'COMPLETO'])));
const enOtraTerna = ternasActivas.docs.some(d => {
  const c = d.data() as CuadroReemplazo;
  return c.candidatos?.some(ca => ca.matricula === matricula) && c.plazaId !== plazaId;
});
```

**Causa raíz:** Carga todas las ternas activas del sistema solo para validar un candidato.  
**Impacto:** Cuando hay muchas ternas, la validación es lenta.

---

### 🟡 PROBLEMA 5: Sin cache/memoización
**Ubicación:** `CuadrosScreen.tsx` y `CuadroDetalleScreen.tsx`

- No hay React Query / SWR / useMemo para cachear consultas
- Cada vez que el usuario entra a la pantalla, se vuelven a cargar todos los datos
- Si el usuario navega entre plazas, vuelve a consultar

---

## ✅ Soluciones Propuestas

### SOLUCIÓN 1: Eliminar N+1 con colección subordinada
**Opción A - Subcolección:** Crear subcolección `plazas/{plazaId}/cuadros`  
**Opción B - Consulta con where compuesto:** Agregar campo `plazaId` en documentos de `cuadros_reemplazo` e indexar.

### SOLUCIÓN 2: Búsqueda de trabajadores con índices Firestore
Crear índices compuestos:
- `trabajadores` → `matricula` (ASC)
- `trabajadores` → `nombre` + `apellidoPaterno` (ASC)

O usar Firebase Functions para búsqueda elástica (Elasticsearch) si hay muchos trabajadores.

### SOLUCIÓN 3: Cache en cliente con React Query / TanStack Query
```typescript
// Ejemplo conceptual
import { useQuery } from '@tanstack/react-query';
const { data: plazas } = useQuery({
  queryKey: ['plazas', usuario.uid],
  queryFn: () => getPlazasPorJefe(usuario.uid),
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

### SOLUCIÓN 4: Validación optimizada
En vez de cargar TODAS las ternas, crear un índice inverso o guardar en cada trabajador las ternas en las que participa.

---

## 🎯 Priorización

| Problema | Severidad | Impacto | Esfuerzo |
|----------|-----------|---------|----------|
| N+1 Query | 🔴 Crítico | Alto | Medio |
| Buscar trabajadores | 🔴 Crítico | Alto | Bajo |
| Sin cache | 🟠 Alto | Medio | Bajo |
| getCuadrosPorJefe | 🟠 Alto | Medio | Medio |
| validarCandidato | 🟡 Medio | Bajo | Bajo |

---

## 📝 Próximo Paso

Esperar autorización del Jefe para implementar las correcciones. La más urgente es la **búsqueda de trabajadores** (Problema 2) ya que afecta directamente la experiencia del usuario al agregar candidatos.
