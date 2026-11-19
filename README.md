# Inventario · Constructora Del Valle S.A.

Quiz #2. Parte B, opción 2, camino 2. Aplicación web para registrar movimientos por bodega u obra, revisar reposición y detectar posibles órdenes duplicadas.

## Ejecutar

Requiere Node.js 24 o posterior y npm. En Windows usa `npm.cmd` si PowerShell restringe scripts.

```powershell
cd backend
npm.cmd ci
npm.cmd start
```

En otra terminal, desde la raíz:

```powershell
cd frontend
npm.cmd start
```

Abre http://127.0.0.1:5173. La API escucha en http://127.0.0.1:3000/api. Cada servicio tiene su propio `.env.example` para cambiar los valores por defecto. El backend aplica `src/db/schema.sql` y la migración `src/db/alertas.sql`, y carga `src/db/seed.sql` una vez al crear la base. Para una demostración limpia, configura otro `DATABASE_PATH` antes de iniciar el backend.

## Acceso al sistema

En la pantalla inicial se muestran las cuentas de demostración. Al elegir una, el sistema rellena los campos y puedes pulsar **Entrar al sistema**.

| Usuario | Contraseña de prueba | Permisos |
|---|---|---|
| admin | DemoAdmin2026! | Consultar y registrar materiales, órdenes y movimientos |
| bodega | DemoBodega2026! | Consultar y registrar movimientos |
| consulta | DemoConsulta2026! | Solo consultas |

El panel inicial muestra materiales, ubicaciones, alertas y posibles órdenes duplicadas. En Existencias puedes filtrar por ubicación y buscar por código o nombre. Estas cuentas públicas son para el prototipo local. SQLite guarda hashes de las contraseñas y el servidor asigna el usuario a cada movimiento a partir de la sesión de ocho horas.

## Arquitectura

- `backend/src/routes` declara endpoints. `controllers` traduce solicitudes y respuestas. `services` contiene validaciones y reglas de negocio. `db` abre SQLite, inicializa el esquema y protege las escrituras relacionadas con transacciones.
- `frontend/src/routes` selecciona la vista por URL. `controllers` consume la API, presenta datos y conecta los formularios con la navegación. Su servidor reenvía las solicitudes al backend.
- `quiz2/` contiene la plantilla Vite preexistente. Los comandos de esta guía usan `frontend/`.

## Reglas

- Stock por material y ubicación = entradas y ajustes positivos, menos salidas y ajustes negativos, más los traslados recibidos y menos los despachados. Cada traslado se registra como un movimiento único con dos ubicaciones.
- Stock de seguridad = (demanda diaria máxima − promedio) × días de entrega. Punto de reorden = demanda promedio × días + stock de seguridad. SQLite registra las alertas activas en la tabla alertas_reorden cuando el stock es estrictamente inferior al punto de reorden. La consulta usa una vista que añade el saldo y el faltante actuales. Al recuperar el nivel de reorden, SQLite retira la alerta en la misma transacción del movimiento. El prototipo aplica el parámetro de cada material en ambas ubicaciones y usa menor stock / punto de reorden para priorizar.
- Duplicados = dos OC diferentes con el mismo proveedor y material, diferencia absoluta entre fechas de hasta `DUPLICATE_DAYS` (3) y diferencia absoluta de cantidades / cantidad mayor × 100 de hasta `DUPLICATE_PERCENT` (10). Ambos límites son inclusivos. Una coincidencia requiere revisión humana.
- Cada entrada requiere una OC que incluya el material y tenga saldo pendiente. Una salida o ajuste negativo requiere stock suficiente. La fecha es la fecha documental y el saldo es acumulado de todos los registros. El alta de OC desde la interfaz registra un material por orden. El movimiento conserva el identificador de la cuenta que lo registró.

## API

| Método | Ruta (prefijo /api) | Uso |
|---|---|---|
| POST | /sesion/entrada y /sesion/salida | Iniciar o cerrar sesión |
| GET | /sesion | Consultar la sesión actual |
| GET / POST | /materiales | Consultar o registrar material |
| GET | /materiales/:id/stock | Stock, mínimo, máximo, seguridad y PR por ubicación |
| GET | /materiales/:id/historial | Movimientos, usuario, ubicaciones y OC de origen |
| GET | /existencias | Saldo por material y ubicación |
| GET | /ubicaciones y /proveedores | Catálogos |
| POST | /movimientos | Entrada, salida, traslado o ajuste |
| GET / POST | /ordenes | Consultar o registrar OC |
| GET | /ordenes/posibles-duplicados | Regla activa y pares sospechosos |
| GET | /alertas/reorden | Déficits activos |

Con una sesión de `admin` o `bodega`, ejemplo de JSON para `POST /api/movimientos`:

```json
{"tipo":"salida","material":1,"cantidad":30,"origen":1,"fecha":"2026-10-20","documento":"VS-DEMO-01"}
```

En una base recién creada, esta salida deja el cemento de Bodega Central en 160 sacos, por debajo del PR de 165.

## Verificar

Ejecuta `npm.cmd test` dentro de `backend`. Las pruebas usan una base temporal y cubren traslados, igualdad con el PR, stock insuficiente, alerta, recepciones parciales, trazabilidad, persistencia, duplicados, validación y rollback.

## Fuentes

Los datos de la constructora y las reglas base provienen de [contexto.md](contexto.md). Los límites de stock, la segunda ubicación y las notas para la matriz de proveedores se definieron para la demostración. El código utiliza Express y el módulo SQLite integrado en Node.js.

## Entregables

- [Informe PDF](output/pdf/informe.pdf) con A1–A5, el circuito de compras y el diagrama entidad-relación. [Fuente editable](docs/informe.html).
- [Presentación de diez minutos](docs/presentacion.html). Ábrela en el navegador y usa las flechas para avanzar. Cada diapositiva incluye notas.
- [Video de demostración](docs/demo.webm) del inicio de sesión y del panel con la alerta de cemento, la OC de origen y la detección de duplicados.

Completa el nombre del equipo y sus integrantes en el informe y en la primera diapositiva.