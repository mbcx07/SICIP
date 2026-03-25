# SICIP — Sistema Integral de Captura de Información de Personal

**IMSS — OOAD Baja California Sur**

Sistema administrativo institucional para la gestión, control, recepción, seguimiento y trazabilidad de trámites de personal en unidades médicas.

## Módulos

- **Solicitudes de Pago** — Tiempo extra, guardias festivas, nivelaciones, sustituciones, contratos
- **Pases** — Entrada, salida, intermedios
- **Licencias** — Médicas, maternidad, sin goce de sueldo
- **Recepción de Documentación** — Control documental

## Roles

| Rol | Descripción |
|-----|-------------|
| TRABAJADOR | Consulta sus propios trámites |
| JEFE_SERVICIO | Genera solicitudes de pago |
| AREA_PERSONAL | Valida, recibe y gestiona trámites |
| ADMIN | Acceso total + configuración normativa |

## Tech Stack

- React 18 + TypeScript
- Vite
- Firebase (Auth + Firestore + Storage)
- Lucide Icons
- Diseño institucional verde IMSS

## Desarrollo

```bash
npm install
npm run dev
```

## Firebase

El proyecto usa Firebase. Configura tu proyecto en `src/services/firebase.ts`.

## Despliegue

```bash
npm run build
firebase deploy
```

## Estados del Sistema

`BORRADOR → GENERADO → PENDIENTE_ENTREGA → RECIBIDO → EN_REVISION → VALIDADO → OBSERVADO/DEVUELTO → RECHAZADO → ENVIADO_DELEGACION → EN_ANALISIS → EN_CRITICA → PENDIENTE_PAGO → PAGADO → CONCLUIDO (+ VENCIDO)`
