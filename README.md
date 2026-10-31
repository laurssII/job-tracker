# Job Tracker

Aplicación web para llevar el seguimiento de las solicitudes de empleo: a qué empresa, rol, modalidad (presencial / híbrido / remoto), cuándo se envió, si han respondido y en qué punto está cada proceso. Todo se guarda en local, en un fichero SQLite.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · SQLite (`better-sqlite3`).

## Qué hace

- **Resumen**: solicitudes enviadas, tasa de respuesta, entrevistas, ofertas, tiempo medio de respuesta, rendimiento por fuente y por modalidad, solicitudes por semana y lista de lo que requiere seguimiento (acciones vencidas y envíos sin respuesta tras 7 días).
- **Solicitudes**: lista con búsqueda y filtros por estado, modalidad y fuente, con varios órdenes.
- **Tablero Kanban**: arrastra las tarjetas entre estados (en móvil, usa el selector de cada tarjeta).
- **Detalle**: todos los datos, notas, próxima acción y línea de tiempo con cada cambio de estado.
- **Alta y edición** con validación; el estado se cambia aparte, con fecha y nota, para que quede en el historial.
- **Exportar a CSV** (separador `;` y codificación UTF-8 con BOM, para que Excel en español lo abra bien; neutraliza fórmulas).

Estados: pendiente de enviar · enviada · respondida · entrevista · prueba técnica · oferta · rechazada · sin respuesta · retirada.

## Puesta en marcha

Requisitos: Node.js 20.9 o superior.

```bash
npm install
npm run seed      # opcional: carga 26 solicitudes ficticias para ver la app con datos
npm run dev       # http://localhost:3000
```

La base de datos se crea sola en `data/job-tracker.db` (está en `.gitignore`: contiene tus datos reales, no la subas a un repositorio).

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y servir en modo producción |
| `npm run seed` | Carga datos de ejemplo (solo si la base de datos está vacía) |
| `npm run seed -- --reset` | **Borra todo** y vuelve a cargar los ejemplos |
| `npm test` | Pruebas unitarias |
| `npm run typecheck` | Comprobación de tipos |

Para usar otro fichero de base de datos (por ejemplo, uno solo para la demo): `DATABASE_PATH=data/demo.db npm run dev`, y lo mismo con `seed`.

## Estructura

```
src/
  app/             páginas (App Router), acciones de servidor y ruta /api/export
  components/      formulario, tablero Kanban, panel de estadísticas…
  lib/
    applications.ts  ÚNICO sitio que habla con la base de datos (consultas SQL)
    db.ts, schema.ts conexión SQLite y esquema
    stats.ts         estadísticas y seguimiento (funciones puras)
    validation.ts    validación de formularios y filtros (funciones puras)
    csv.ts, dates.ts, format.ts, constants.ts, types.ts
    seed-data.ts     datos de ejemplo ficticios
scripts/seed.ts    carga de datos de ejemplo
tests/             pruebas con el test runner de Node
```

## Modelo de datos

- `applications`: una fila por solicitud (empresa, rol, modalidad, ubicación, contrato, salario, fuente, fecha, estado actual, contacto, versión de CV, notas, próxima acción).
- `status_history`: una fila por cada cambio de estado, con fecha y nota. Nunca se sobrescribe: de aquí salen el tiempo de respuesta y la línea de tiempo.

Decisiones que conviene conocer:

- Las fechas son texto `YYYY-MM-DD`, sin hora ni zona horaria, para evitar desfases.
- Una solicitud cuenta como «respondida» si alguna vez pasó por respondida, entrevista, prueba técnica, oferta o rechazada. «Sin respuesta» no cuenta como respuesta.
- Si una solicitud pendiente pasa a enviada, su fecha de solicitud pasa a ser la del envío.
- `status` y `work_mode` se validan en la aplicación y no con `CHECK` de SQL, para poder añadir estados sin migrar.

## Siguiente paso: la demo pública en Vercel

Esta versión es para uso local. Antes de publicarla hay que resolver:

1. **Base de datos**: Vercel no conserva ficheros entre ejecuciones, así que SQLite no sirve allí. Migra a Postgres (Neon o Supabase). Solo hay que reescribir `src/lib/applications.ts` y `src/lib/db.ts` manteniendo las mismas funciones; el resto de la app no toca SQL.
2. **Datos de la demo**: la demo debe usar datos ficticios (`seed-data.ts` ya lo es) y no tus solicitudes reales. Opciones: datos en el navegador por visitante, o cuenta demo con reseteo periódico.
3. **Acceso**: ahora mismo cualquiera que llegue a la app puede ver y modificar todo. Para tu uso real, añade autenticación; para la demo, aísla los datos por visitante.
4. **Abusos**: limita el tamaño de lo que se puede guardar y, si añades funciones con IA, ponles un límite de uso.

## Estado de verificación

El código se escribió en un entorno sin acceso al registro de npm, así que **no se ha podido ejecutar `npm install` ni compilar la interfaz con Next.js**. Lo que sí se comprobó:

- Las 22 pruebas unitarias pasan (base de datos, estadísticas, CSV, validación, carga de datos de ejemplo), usando `node:sqlite` como sustituto de `better-sqlite3`, que ofrece la misma API para lo que usa la app.
- La comprobación de tipos de TypeScript pasa con tipos simplificados de React y Next.
- La carga de datos de ejemplo y la exportación CSV funcionan contra una base de datos temporal.

Lo que falta por confirmar en tu equipo: `npm install`, `npm run dev`, `npm run build` y el aspecto de las pantallas. Si algo falla en el primer arranque, lo más probable es un detalle de versiones o de la interfaz, y se corrige rápido con el mensaje de error.
