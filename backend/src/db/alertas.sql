CREATE TABLE IF NOT EXISTS alertas_reorden (
 material INTEGER NOT NULL REFERENCES materiales(id),
 ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones(id),
 PRIMARY KEY (material, ubicacion_id)
) STRICT;

DROP VIEW IF EXISTS alertas;
CREATE VIEW alertas AS
SELECT e.*, ROUND(e.reorden-e.stock,3) AS faltante
FROM alertas_reorden a
JOIN existencias e ON e.material=a.material AND e.ubicacion_id=a.ubicacion_id;

CREATE TRIGGER IF NOT EXISTS alertas_al_registrar_material
AFTER INSERT ON materiales
BEGIN
 INSERT INTO alertas_reorden
 SELECT material,ubicacion_id FROM existencias
 WHERE material=NEW.id AND stock<reorden;
END;

CREATE TRIGGER IF NOT EXISTS alertas_al_registrar_ubicacion
AFTER INSERT ON ubicaciones
BEGIN
 INSERT INTO alertas_reorden
 SELECT material,ubicacion_id FROM existencias
 WHERE ubicacion_id=NEW.id AND stock<reorden;
END;

CREATE TRIGGER IF NOT EXISTS alertas_al_registrar_movimiento
AFTER INSERT ON movimientos
BEGIN
 DELETE FROM alertas_reorden
 WHERE material=NEW.material AND ubicacion_id IN (NEW.origen,NEW.destino);
 INSERT INTO alertas_reorden
 SELECT material,ubicacion_id FROM existencias
 WHERE material=NEW.material AND ubicacion_id IN (NEW.origen,NEW.destino) AND stock<reorden;
END;

INSERT OR IGNORE INTO alertas_reorden
SELECT material,ubicacion_id FROM existencias WHERE stock<reorden;