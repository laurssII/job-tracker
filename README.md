# Job Tracker

Aplicación web para llevar el seguimiento de las solicitudes de empleo: a qué empresa, rol, modalidad (presencial / híbrido / remoto), cuándo se envió, si han respondido y en qué punto está cada proceso. 

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
| `npm run dev:demo` / `build:demo` / `start:demo` | Lo mismo, pero en **modo demo** (datos ficticios en el navegador, sin base de datos) |
| `npm run seed` | Carga datos de ejemplo (solo si la base de datos está vacía) |
| `npm run seed -- --reset` | **Borra todo** y vuelve a cargar los ejemplos |
| `npm test` | Pruebas unitarias |
| `npm run typecheck` | Comprobación de tipos |

Para usar otro fichero de base de datos (por ejemplo, uno solo para la demo): `DATABASE_PATH=data/demo.db npm run dev`, y lo mismo con `seed`.

## Estructura

```
src/
  app/             páginas (App Router), acciones de servidor y ruta /api/export
  components/
    views/         pantallas reutilizables (resumen, lista, detalle), usadas por los dos modos
    demo/          envoltorios del modo demo (leen y escriben en el navegador)
    …              formulario, tablero Kanban, panel de estadísticas
  lib/
    applications.ts  capa de datos del modo normal: consultas SQL (SQLite)
    local-store.ts   capa de datos del modo demo: misma API sobre localStorage
    repository.ts    contrato que cumplen las dos capas
    mode.ts          IS_DEMO (variable NEXT_PUBLIC_DEMO)
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

## Modo demo y publicación en Vercel

La misma aplicación tiene dos modos:

| | Modo normal (tu uso real) | Modo demo (portfolio) |
| --- | --- | --- |
| Datos | SQLite en `data/job-tracker.db`, vacío al empezar | `localStorage` del navegador de cada visitante |
| Precarga | Ninguna (el seed es opcional) | 26 solicitudes ficticias la primera vez |
| Servidor | Guarda y lee los datos | No guarda nada; las acciones del servidor están desactivadas |
| Se activa con | por defecto | `NEXT_PUBLIC_DEMO=true` |

En la demo cada visitante tiene su propia copia: lo que haga no lo ve nadie más, y un botón «Restablecer datos» en la barra superior la deja como al principio. La exportación a CSV se genera en el navegador.

Probarla en local: `npm run dev:demo`. Si cambias entre `dev` y `dev:demo`, borra antes la carpeta `.next` (el modo se fija al compilar).

## Verificación

- 38 pruebas unitarias (`npm test`): base de datos, estadísticas, CSV, validación y carga de datos de ejemplo. Los mismos casos se ejecutan contra la capa SQLite y contra el almacén del navegador, para que los dos modos se comporten igual.
- `npm run typecheck` y `npm run build` pasan en modo normal.
- El modo demo (`dev:demo`, `build:demo`) hay que probarlo todavía en un navegador real: las pruebas cubren su lógica de datos, no las pantallas.
