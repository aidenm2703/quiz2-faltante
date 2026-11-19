# CONTEXTO: Quiz #2 · Trabajo práctico · Gestión de Inventarios
(antes: Compras y Proveedores)

> **Instrucción para la IA:** Este archivo contiene TODOS los requisitos del trabajo. Léelo completo antes de responder o generar cualquier cosa. No omitas ni inventes requisitos. Si algo falta o no está claro, pregunta antes de asumir. Toda entrega debe cumplir la rúbrica, los entregables y las reglas generales descritas abajo. Respeta los datos del enunciado tal cual (cifras, nombres, fechas).

---

## 1. Datos generales

| Campo | Valor |
|-------|-------|

| Componentes | **Parte A:** análisis de compras e inventario (40 pts). **Parte B:** desarrollo de una solución en Node.js + base de datos (60 pts) |
| Tecnología obligatoria | Node.js conectado a una base de datos, ya sea con **n8n** o con un **back end propio** |
| Campos a completar | Nombre del equipo e integrantes |

### Propósito
El área de compras y abastecimiento es un lugar donde la empresa gana o pierde mucho dinero sin darse cuenta. El trabajo busca que el equipo:
- Entienda el circuito completo de una compra.
- Aprenda a leer el gasto para encontrar fugas de valor.
- Evalúe proveedores con criterios más allá del precio.
- Lleve todo al control de inventario: cuánto hay, cuándo reponer y de dónde vino cada existencia.

La segunda mitad es práctica: construir **una de las tres soluciones** de negocio discutidas en el taller con **Node.js + base de datos** (n8n o back end propio).

### Objetivos de aprendizaje
1. Describir el circuito de una compra (**requisición → aprobación → orden de compra → recepción → factura → pago**) y definir quién aprueba qué según el monto.
2. Justificar por qué una taxonomía de categorías de gasto bien definida es la base de cualquier análisis.
3. Realizar un análisis de gasto que detecte **compras duplicadas, compras fuera de contrato y sobreprecios**.
4. Evaluar proveedores con una **matriz ponderada** (precio, calidad, plazo de entrega, servicio, condiciones de pago, riesgo).
5. Calcular niveles de stock, stock de seguridad y punto de reorden, y diseñar la trazabilidad de existencias.
6. Implementar una solución funcional con Node.js y una base de datos que resuelva un problema real de compras o inventario.

### Conceptos clave

| Concepto | Definición breve |
|----------|------------------|
| Requisición | Solicitud interna de un área para que se compre algo. Todavía no compromete dinero. |
| Orden de compra (OC) | Documento formal enviado al proveedor que compromete a la empresa a pagar por bienes o servicios en condiciones definidas. |
| Categoría de gasto | Agrupación estandarizada de lo que se compra (p. ej. Materiales de construcción › Cemento y agregados). |
| Análisis de gasto | Revisión sistemática de lo comprado: a quién, cuánto, a qué precio y bajo qué condiciones. |
| Gasto fuera de contrato | Compra hecha a un proveedor o a un precio distinto al negociado en un contrato vigente. |
| Fuga de valor | Dinero perdido por duplicidad, sobreprecio, compras fuera de contrato o descuentos no aplicados. |
| Consolidación de proveedores | Reducir la cantidad de proveedores de una categoría para concentrar volumen. |
| Poder de negociación | Capacidad de obtener mejores condiciones gracias al volumen, la información o las alternativas. |
| Nivel de stock | Cantidad disponible de un artículo en un momento dado (mínimo, máximo, actual, de seguridad). |
| Punto de reorden (PR) | Nivel de stock en el que se debe emitir una nueva orden. **PR = demanda diaria × tiempo de entrega + stock de seguridad.** |

---

## 2. PARTE A · Análisis de compras e inventario (40 puntos)

Se responde cada ejercicio **en el informe escrito**. Los datos son ficticios y representan a **Constructora Del Valle S.A.**, empresa costarricense mediana con tres áreas que compran por su cuenta: **Obras, Mantenimiento y Bodega Central**. Moneda: colones (₡).

### Ejercicio A1. Circuito de compra y matriz de aprobación (8 pts)

**a)** Dibujar el circuito completo de una compra desde la requisición hasta el pago. Para **cada etapa** indicar: **quién la ejecuta, qué documento se genera y qué control se hace** (por ejemplo, el *three-way match* entre OC, recepción y factura).

**b)** Analizar la matriz de aprobación propuesta por la empresa y **proponer mejoras**. Responder: ¿qué riesgo existe si alguien divide una compra grande en varias pequeñas para quedarse bajo un umbral (fraccionamiento)?

| Monto de la compra | Aprueba | Cotizaciones requeridas |
|--------------------|---------|-------------------------|
| Hasta ₡250 000 | Jefatura del área solicitante | 1 |
| ₡250 001 a ₡2 000 000 | Jefatura de Compras | 2 |
| ₡2 000 001 a ₡10 000 000 | Gerencia Financiera | 3 |
| Más de ₡10 000 000 | Gerencia General | 3 + comité de compras |

### Ejercicio A2. Clasificación de categorías de gasto (8 pts)

Líneas del ERP (varias son el mismo insumo con nombres distintos según el área):

| # | Descripción en el ERP | Área | Proveedor | Cant. | Precio unit. |
|---|-----------------------|------|-----------|-------|--------------|
| 1 | Cemento gris 50 kg | Obras | Proveedor A | 200 | ₡6 450 |
| 2 | Saco cemento uso general | Mantenimiento | Proveedor B | 40 | ₡7 100 |
| 3 | CEM-GRIS-50 | Bodega Central | Proveedor A | 300 | ₡6 300 |
| 4 | Varilla #3 grado 40 | Obras | Proveedor C | 500 | ₡2 150 |
| 5 | Hierro 3/8 x 6 m | Mantenimiento | Proveedor D | 60 | ₡2 600 |
| 6 | Guantes de nitrilo talla L | Bodega Central | Proveedor E | 100 | ₡850 |
| 7 | Guantes trabajo L | Obras | Proveedor F | 80 | ₡1 200 |
| 8 | Tubo PVC 1/2 SDR 13.5 | Mantenimiento | Proveedor B | 25 | ₡2 900 |

Se pide:
- Proponer una **taxonomía de dos niveles** (categoría › subcategoría) y un **código estándar** para cada artículo.
- **Reclasificar las 8 líneas** y decir cuáles corresponden al mismo insumo.
- Calcular **cuánto se habría ahorrado** si todas las compras de **cemento y de varilla** se hubieran hecho **al menor precio observado**.
- Explicar en **un párrafo** por qué sin esta clasificación es imposible negociar por volumen.

### Ejercicio A3. Análisis de gasto y fuga de valor (10 pts)

**Contrato vigente con el Proveedor A:** cemento gris 50 kg a **₡6 300** y varilla #3 a **₡2 050**.

Extracto de órdenes de compra de octubre:

| OC | Fecha | Área | Proveedor | Artículo | Cant. | Precio | Total |
|----|-------|------|-----------|----------|-------|--------|-------|
| OC-1041 | 02/10 | Obras | Prov. A | Cemento gris 50 kg | 200 | ₡6 450 | ₡1 290 000 |
| OC-1042 | 02/10 | Obras | Prov. A | Cemento gris 50 kg | 200 | ₡6 450 | ₡1 290 000 |
| OC-1047 | 06/10 | Mant. | Prov. B | Cemento gris 50 kg | 40 | ₡7 100 | ₡284 000 |
| OC-1050 | 08/10 | Obras | Prov. C | Varilla #3 | 500 | ₡2 150 | ₡1 075 000 |
| OC-1053 | 09/10 | Obras | Prov. C | Varilla #3 | 480 | ₡2 150 | ₡1 032 000 |
| OC-1058 | 13/10 | Mant. | Prov. D | Varilla #3 | 60 | ₡2 600 | ₡156 000 |
| OC-1061 | 15/10 | Bodega | Prov. A | Cemento gris 50 kg | 300 | ₡6 300 | ₡1 890 000 |

Se pide:
- Identificar **posibles compras duplicadas** y explicar el criterio usado (mismo proveedor, artículo, cantidad y fecha cercana).
- Identificar el **gasto fuera de contrato** y el **sobreprecio de cada línea** frente al precio contratado.
- **Cuantificar la fuga de valor total del mes** y **proyectar su efecto anual**.
- Proponer **tres controles concretos** (de proceso o de sistema) para que no se repita.

### Ejercicio A4. Evaluación de proveedores (7 pts)

Construir una **matriz ponderada** para comparar **tres proveedores de materiales** (puede usarse Novex, Construplaza y EPA como referencia, o proveedores ficticios).
- Definir **al menos cinco criterios** con su peso (**la suma debe dar 100 %**). Opciones: precio, calidad, cumplimiento de plazos, condiciones de crédito, servicio posventa, cobertura geográfica, riesgo de dependencia.
- Asignar **nota de 1 a 5** a cada proveedor y calcular el **puntaje ponderado**.
- **Argumentar** si conviene consolidar la categoría en uno solo o mantener dos proveedores.

### Ejercicio A5. Niveles de stock y punto de reorden (7 pts)

Fórmulas: **PR = d × L + SS**, donde *d* = demanda diaria promedio, *L* = tiempo de entrega en días, *SS* = stock de seguridad. Aproximación simple: **SS = (demanda diaria máxima − demanda diaria promedio) × L**.

| Material | Demanda prom./día | Demanda máx./día | Tiempo de entrega | Stock actual |
|----------|-------------------|------------------|-------------------|--------------|
| Cemento gris 50 kg | 40 sacos | 55 sacos | 3 días | 190 sacos |
| Varilla #3 | 120 unid. | 160 unid. | 5 días | 850 unid. |
| Block 12 × 20 × 40 | 600 unid. | 900 unid. | 4 días | 2 800 unid. |
| Arena (m³) | 6 m³ | 10 m³ | 2 días | 14 m³ |

Se pide:
- Calcular el **stock de seguridad** y el **punto de reorden** de cada material.
- Indicar **cuáles deben reponerse hoy** y en **qué orden de prioridad**.
- Proponer los **datos mínimos** que debe registrar cada movimiento (entrada, salida, traslado entre obras) para tener **trazabilidad completa** de las existencias.

---

## 3. PARTE B · Desarrollo de una solución (60 puntos)

Cada equipo elige **UNA de las tres opciones** y construye un **prototipo funcional**. Pueden reutilizar los datos de la Parte A como datos semilla.

### Requisito técnico obligatorio
La solución debe construirse con **Node.js** y estar conectada a una **base de datos real** (PostgreSQL, MySQL, SQLite o MongoDB). Dos caminos válidos:

- **Camino 1: n8n.** Workflows en n8n que leen y escriben en la BD con sus nodos nativos (Postgres, MySQL, MongoDB), con **disparadores programados (Schedule/Cron)**, **Webhooks** para recibir datos y **nodos Code en JavaScript** para la lógica de negocio. **Deben exportar los workflows en JSON.**
- **Camino 2: back end propio.** API REST en Node.js (Express, Fastify o NestJS) con acceso a datos mediante ORM o cliente (Prisma, Sequelize, Knex, Mongoose o driver nativo), **migraciones o script SQL de creación** y **validación de datos de entrada**.
- Se permite **combinar ambos** (ej. n8n para captura automática + back end para la API).

### Opción 1. Comparador de precios / catálogo de proveedores

Catálogo que se actualiza automáticamente con precios de fuentes externas (Novex, Construplaza, EPA) y permite comparar el mismo producto entre proveedores.

**Requisitos mínimos:**
- Tabla de **productos normalizados** (código interno estándar) y tabla de **equivalencias** producto ↔ producto del proveedor.
- Proceso **automático programado** que obtenga precios de **al menos dos fuentes** y guarde el **histórico** (no sobrescribir: cada captura es un registro con fecha).
- Consulta o endpoint que, dado un producto, devuelva el **precio vigente en cada proveedor ordenado de menor a mayor**.
- **Alerta** cuando un precio varíe más de un **porcentaje configurable** respecto a la captura anterior.
- **Manejo de errores:** si una fuente falla o cambia su estructura, el proceso registra el error y continúa con las demás.

> **Nota ética y legal:** antes de extraer datos de un sitio web, revisar sus términos de uso y su `robots.txt`, limitar la frecuencia de consultas y no evadir bloqueos. Si una fuente no permite extracción, usar un archivo **CSV o JSON simulado** como fuente y **documentarlo en el README**.

### Opción 2. Control de inventario para una empresa de construcción

Sistema que lleva el stock por material y por bodega u obra, avisa cuándo reponer y detecta compras duplicadas.

**Requisitos mínimos:**
- **Registro de materiales** con stock mínimo, máximo, demanda promedio y tiempo de entrega; el **punto de reorden se calcula, no se digita**.
- **Registro de movimientos** (entrada, salida, traslado, ajuste) con fecha, usuario, cantidad, ubicación y documento de origen (OC, vale de salida). **El stock actual se obtiene de los movimientos.**
- **Alerta de reorden** (correo, Telegram, Slack o tabla de alertas) cuando el stock cae por debajo del punto de reorden.
- **Detección de posibles compras duplicadas:** mismo proveedor, mismo artículo, cantidad similar y fechas cercanas (**definir y documentar la regla**).
- **Consulta de trazabilidad:** dado un material, mostrar el historial de movimientos y de qué OC proviene cada entrada.

### Opción 3. Motor de códigos de promoción y descuentos (caso Joaquín, AON)

Motor que aplica automáticamente las promociones vigentes a las OC según reglas de negocio, para que ningún descuento negociado se pierda.

**Requisitos mínimos:**
- Tabla de **promociones** con código, proveedor, vigencia (desde/hasta), **tipo** (porcentaje, monto fijo, escalonado por volumen, 2×1) y **condiciones** (monto mínimo, categoría, artículo).
- Al registrar o recibir una OC, el motor **evalúa las reglas y aplica la promoción válida**; debe definir qué pasa si varias aplican (la mejor, acumulables o por prioridad).
- **Registro de auditoría:** qué promoción se aplicó a cada OC, cuánto se ahorró y por qué se descartaron las demás.
- **Reporte** de ahorro total **por proveedor y por mes**, y de promociones vigentes **que no se usaron** (descuentos dejados sobre la mesa).
- **Pruebas con al menos cinco casos:** promoción vencida, monto bajo el mínimo, dos promociones en conflicto, categoría no aplicable y caso válido.

### Arquitectura de referencia (ejemplo Camino 2, Opción 2; es guía, no plantilla obligatoria)

```
inventario-api/
├── src/
│   ├── db/          # conexión, migraciones, seed.sql
│   ├── routes/      # materiales, movimientos, ordenes, alertas
│   ├── services/    # reorden.js, duplicados.js
│   └── index.js
├── .env.example     # DATABASE_URL=... (nunca subir credenciales)
└── README.md
```

Endpoints de ejemplo:
- `GET /materiales/:id/stock` → stock actual, PR y estado
- `POST /movimientos` → registra entrada/salida y recalcula
- `GET /alertas/reorden` → materiales bajo el punto de reorden
- `GET /ordenes/posibles-duplicados` → OC sospechosas según la regla definida

Equivalente en n8n: **Webhook** (recibe el movimiento) → **Postgres** (inserta) → **Code** (calcula stock y PR) → **IF** (¿stock < PR?) → **Email/Telegram** (alerta), más un segundo flujo con **Schedule Trigger** diario que busca duplicados.

---

## 4. Entregables (a más tardar viernes 6 de noviembre de 2026, en el canal indicado por el docente)

| Entregable | Contenido esperado |
|------------|--------------------|
| 1. Informe (PDF) | Respuestas de la Parte A, descripción de la solución elegida, **diagrama del circuito de compra**, **modelo de datos (diagrama entidad-relación)** y conclusiones. **Máximo 15 páginas.** |
| 2. Repositorio (GitHub o GitLab) | Código fuente o workflows de n8n exportados en JSON, **script de creación de la BD y datos semilla**, archivo **.env.example** y **README** con instrucciones para correr el proyecto. |
| 3. Video demo | **Máximo 5 minutos** mostrando el sistema funcionando con datos reales o de prueba, incluido **al menos un caso de alerta o detección**. |
| 4. Presentación en clase | **10 minutos por equipo:** problema de negocio, solución, demo y aprendizajes. |

---

## 5. Rúbrica de evaluación (100 puntos)

| Criterio | Pts | Excelente | Insuficiente |
|----------|-----|-----------|--------------|
| A1. Circuito y matriz de aprobación | 8 | Circuito completo, controles claros y riesgo de fraccionamiento resuelto | Etapas incompletas o sin responsables |
| A2. Categorías de gasto | 8 | Taxonomía coherente, reclasificación correcta y ahorro bien calculado | Clasificación arbitraria o sin cálculo |
| A3. Análisis de gasto | 10 | Detecta duplicados, fuera de contrato y sobreprecio; cuantifica y propone controles | Detección parcial, sin cuantificar |
| A4. Evaluación de proveedores | 7 | Criterios y pesos justificados, recomendación argumentada | Solo compara precio |
| A5. Stock y punto de reorden | 7 | Cálculos correctos, prioridades y trazabilidad bien definidas | Errores de cálculo |
| B1. Funcionalidad | 20 | Cumple todos los requisitos mínimos de la opción elegida | Faltan funciones centrales |
| B2. Base de datos y modelo | 12 | Modelo normalizado, histórico y trazabilidad; datos semilla útiles | Datos en memoria o tablas sin relación |
| B3. Lógica de negocio | 12 | Reglas claras, configurables y probadas con casos borde | Reglas fijas en el código sin pruebas |
| B4. Calidad técnica | 8 | Código ordenado, manejo de errores, credenciales fuera del repo, README reproducible | No se puede ejecutar |
| B5. Presentación y demo | 8 | Comunica el valor de negocio y demuestra el sistema en vivo | Demo no funciona o no explica el valor |

### Puntos extra (hasta 10)
- Interfaz web sencilla (dashboard) que consuma la API o los datos de n8n.
- Integración entre opciones (ej. el inventario genera una requisición y el comparador sugiere el proveedor más barato).
- Pruebas automatizadas (Jest, Vitest o similar) o despliegue en la nube con URL funcional.
- Aplicación de la **matriz de aprobación de A1** dentro del sistema (la OC queda pendiente hasta que la apruebe el rol correcto).

---

## 6. Cronograma sugerido

| Semana | Fechas | Avance esperado |
|--------|--------|-----------------|
| 1 | 7 – 13 oct | Formar equipos, elegir opción, resolver A1 y A2. |
| 2 | 14 – 20 oct | Ejercicios A3 a A5. Diseñar el modelo de datos y elegir camino (n8n o back end). |
| 3 | 21 – 27 oct | BD creada con datos semilla. Primer flujo o endpoint funcionando. |
| 4 | 28 oct – 3 nov | Completar requisitos mínimos, alertas y pruebas de casos borde. |
| 5 | 4 – 6 nov | Video, README, informe final y ensayo de la presentación. Entrega el viernes 6. |

---

## 7. Reglas generales
- Se pueden usar **asistentes de IA** para programar, pero **cada integrante debe poder explicar cualquier parte del código o del flujo** durante la presentación.
- **No subir contraseñas, tokens ni cadenas de conexión** al repositorio; usar **variables de entorno**.
- **Citar** cualquier fuente externa de datos o código reutilizado.
- Entregas tardías: **pierden 10 puntos por día hábil**, salvo acuerdo previo con el docente.

---

## 8. Checklist final para la IA (verificar antes de dar algo por terminado)

**Parte A**
- [ ] A1: circuito con 6 etapas (requisición → aprobación → OC → recepción → factura → pago), cada una con responsable, documento y control (three-way match); mejoras a la matriz y riesgo de fraccionamiento.
- [ ] A2: taxonomía de 2 niveles + código estándar; 8 líneas reclasificadas; insumos iguales identificados; ahorro de cemento y varilla al menor precio; párrafo sobre negociación por volumen.
- [ ] A3: duplicados con criterio explícito; fuera de contrato y sobreprecio por línea (vs ₡6 300 cemento y ₡2 050 varilla); fuga mensual y proyección anual; 3 controles concretos.
- [ ] A4: 3 proveedores, 5+ criterios con pesos que suman 100 %, notas 1–5, puntaje ponderado, recomendación (consolidar o 2 proveedores).
- [ ] A5: SS y PR de los 4 materiales con la fórmula dada; cuáles reponer hoy y prioridad; datos mínimos de cada movimiento para trazabilidad.

**Parte B**
- [ ] Una sola opción elegida (1, 2 o 3), con todos sus requisitos mínimos.
- [ ] Node.js + BD real (PostgreSQL, MySQL, SQLite o MongoDB); camino n8n (JSON exportado) o back end propio (migraciones/script SQL, validación de entrada).
- [ ] Modelo normalizado con histórico y trazabilidad; datos semilla útiles (pueden venir de la Parte A).
- [ ] Reglas de negocio configurables y probadas con casos borde.
- [ ] Manejo de errores; credenciales solo en variables de entorno; `.env.example`; README reproducible.

**Entregables**
- [ ] Informe PDF ≤ 15 páginas (Parte A, solución, diagrama del circuito, DER, conclusiones).
- [ ] Repositorio (código/workflows JSON, script de BD + seed, .env.example, README).
- [ ] Video demo ≤ 5 min con al menos un caso de alerta o detección.
- [ ] Presentación de 10 min (problema, solución, demo, aprendizajes); todos los integrantes pueden explicar el código.
- [ ] Fuentes externas citadas; sin secretos en el repo.