INSERT INTO materiales VALUES
 (1,'CEM-GRIS-50','Cemento gris 50 kg','sacos',165,500,40,55,3),
 (2,'VAR-03','Varilla #3','unidades',800,1500,120,160,5),
 (3,'BLK-122040','Block 12 × 20 × 40','unidades',3600,7000,600,900,4),
 (4,'ARE-M3','Arena','m³',20,60,6,10,2);
INSERT INTO ubicaciones VALUES (1,'Bodega Central'),(2,'Obra Norte');
INSERT INTO proveedores VALUES (1,'Proveedor A'),(2,'Proveedor B'),(3,'Proveedor C'),(4,'Proveedor D');
INSERT INTO ordenes VALUES
 (1,'OC-1041',1,'2026-10-02','Obras'),(2,'OC-1042',1,'2026-10-02','Obras'),
 (3,'OC-1047',2,'2026-10-06','Mantenimiento'),(4,'OC-1050',3,'2026-10-08','Obras'),
 (5,'OC-1053',3,'2026-10-09','Obras'),(6,'OC-1058',4,'2026-10-13','Mantenimiento'),
 (7,'OC-1061',1,'2026-10-15','Bodega Central');
INSERT INTO lineas VALUES (1,1,1,200,6450),(2,2,1,200,6450),(3,3,1,40,7100),
 (4,4,2,500,2150),(5,5,2,480,2150),(6,6,2,60,2600),(7,7,1,300,6300);
INSERT INTO movimientos VALUES
 (1,1,'entrada',190,'2026-10-16','Bodega',NULL,1,'OC-1061',7),
 (2,2,'ajuste',850,'2026-10-16','Bodega',NULL,1,'INV-INICIAL',NULL),
 (3,3,'ajuste',2800,'2026-10-16','Bodega',NULL,1,'INV-INICIAL',NULL),
 (4,4,'ajuste',14,'2026-10-16','Bodega',NULL,1,'INV-INICIAL',NULL);
INSERT INTO semillas VALUES (1);