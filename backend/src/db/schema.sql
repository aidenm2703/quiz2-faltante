CREATE TABLE IF NOT EXISTS materiales (
 id INTEGER PRIMARY KEY, codigo TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL, unidad TEXT NOT NULL,
 minimo REAL NOT NULL CHECK(minimo>=0), maximo REAL NOT NULL CHECK(maximo>=minimo),
 demanda REAL NOT NULL CHECK(demanda>=0), demanda_max REAL NOT NULL CHECK(demanda_max>=demanda),
 entrega INTEGER NOT NULL CHECK(entrega>0)
) STRICT;
CREATE TABLE IF NOT EXISTS ubicaciones (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL UNIQUE) STRICT;
CREATE TABLE IF NOT EXISTS proveedores (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL UNIQUE) STRICT;
CREATE TABLE IF NOT EXISTS ordenes (
 id INTEGER PRIMARY KEY, numero TEXT NOT NULL UNIQUE, proveedor INTEGER NOT NULL REFERENCES proveedores(id),
 fecha TEXT NOT NULL, area TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS lineas (
 id INTEGER PRIMARY KEY, orden INTEGER NOT NULL REFERENCES ordenes(id),
 material INTEGER NOT NULL REFERENCES materiales(id), cantidad REAL NOT NULL CHECK(cantidad>0),
 precio REAL NOT NULL CHECK(precio>0), UNIQUE(orden,material)
) STRICT;
CREATE TABLE IF NOT EXISTS movimientos (
 id INTEGER PRIMARY KEY, material INTEGER NOT NULL REFERENCES materiales(id),
 tipo TEXT NOT NULL, cantidad REAL NOT NULL CHECK(cantidad>0), fecha TEXT NOT NULL, usuario TEXT NOT NULL,
 origen INTEGER REFERENCES ubicaciones(id), destino INTEGER REFERENCES ubicaciones(id),
 documento TEXT NOT NULL, linea INTEGER REFERENCES lineas(id),
 CHECK ((tipo='entrada' AND origen IS NULL AND destino IS NOT NULL AND linea IS NOT NULL)
 OR (tipo='salida' AND origen IS NOT NULL AND destino IS NULL AND linea IS NULL)
 OR (tipo='traslado' AND origen IS NOT NULL AND destino IS NOT NULL AND origen<>destino AND linea IS NULL)
 OR (tipo='ajuste' AND (origen IS NULL)<>(destino IS NULL) AND linea IS NULL))
) STRICT;
CREATE VIEW IF NOT EXISTS existencias AS
WITH cambios AS (
 SELECT material,destino AS ubicacion,cantidad FROM movimientos WHERE destino IS NOT NULL
 UNION ALL SELECT material,origen,-cantidad FROM movimientos WHERE origen IS NOT NULL
), saldos AS (
 SELECT material,ubicacion,ROUND(SUM(cantidad),3) AS stock FROM cambios GROUP BY material,ubicacion
)
SELECT m.id AS material,m.codigo,m.nombre,m.unidad,m.minimo,m.maximo,u.id AS ubicacion_id,u.nombre AS ubicacion,
 COALESCE(s.stock,0) AS stock,ROUND((m.demanda_max-m.demanda)*m.entrega,3) AS seguridad,
 ROUND(m.demanda_max*m.entrega,3) AS reorden
FROM materiales m CROSS JOIN ubicaciones u LEFT JOIN saldos s ON s.material=m.id AND s.ubicacion=u.id;
CREATE TABLE IF NOT EXISTS semillas (version INTEGER PRIMARY KEY) STRICT;

CREATE TABLE IF NOT EXISTS usuarios (
 id INTEGER PRIMARY KEY, usuario TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL,
 rol TEXT NOT NULL CHECK(rol IN ('admin','bodega','consulta')), sal TEXT NOT NULL, clave TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sesiones (
 token TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 vence INTEGER NOT NULL
) STRICT;