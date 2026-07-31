-- Crea (si no existe) el submodulo "Gestionar paquetes" dentro de "Gestion de pedidos"
-- y registra sus acciones base para administracion.

SET @hoy := DATE_FORMAT(NOW(), '%Y%m%d');
SET @hora := DATE_FORMAT(NOW(), '%H%i%s');

SET @modulo_id := (
  SELECT m.ID_MODULO
  FROM modulo m
  WHERE m.CODIGO IN ('GESTION_PEDIDOS', 'PEDIDOS', 'GESTION_DE_PEDIDOS')
  ORDER BY FIELD(m.CODIGO, 'GESTION_PEDIDOS', 'PEDIDOS', 'GESTION_DE_PEDIDOS')
  LIMIT 1
);

INSERT INTO modulo (
  UUID_MODULO,
  CODIGO,
  DESCRIPCION,
  ICONO,
  ORDEN,
  FEC_ALTA,
  HORA_ALTA,
  CVE_USUARIO_ALTA,
  DES_IP_ALTA,
  ESTADO
)
SELECT
  UUID(),
  'GESTION_PEDIDOS',
  'Gestion de pedidos',
  'shopping-cart',
  40,
  @hoy,
  @hora,
  'SYSTEM',
  '127.0.0.1',
  1
WHERE @modulo_id IS NULL;

SET @modulo_id := COALESCE(
  @modulo_id,
  (SELECT ID_MODULO FROM modulo WHERE CODIGO = 'GESTION_PEDIDOS' LIMIT 1)
);

SET @submodulo_id := (
  SELECT s.ID_SUBMODULO
  FROM submodulo s
  WHERE s.MODULO_ID = @modulo_id
    AND s.CODIGO = 'GESTIONAR_PAQUETES'
  LIMIT 1
);

INSERT INTO submodulo (
  UUID_SUBMODULO,
  MODULO_ID,
  CODIGO,
  DESCRIPCION,
  ORDEN,
  FEC_ALTA,
  HORA_ALTA,
  CVE_USUARIO_ALTA,
  DES_IP_ALTA,
  ESTADO
)
SELECT
  UUID(),
  @modulo_id,
  'GESTIONAR_PAQUETES',
  'Gestionar paquetes',
  10,
  @hoy,
  @hora,
  'SYSTEM',
  '127.0.0.1',
  1
WHERE @submodulo_id IS NULL;

SET @submodulo_id := COALESCE(
  @submodulo_id,
  (
    SELECT ID_SUBMODULO
    FROM submodulo
    WHERE MODULO_ID = @modulo_id
      AND CODIGO = 'GESTIONAR_PAQUETES'
    LIMIT 1
  )
);

INSERT INTO accion (
  UUID_ACCION,
  SUBMODULO_ID,
  CODIGO,
  DESCRIPCION,
  ORDEN,
  FEC_ALTA,
  HORA_ALTA,
  CVE_USUARIO_ALTA,
  DES_IP_ALTA,
  ESTADO
)
SELECT
  UUID(),
  @submodulo_id,
  x.codigo,
  x.descripcion,
  x.orden,
  @hoy,
  @hora,
  'SYSTEM',
  '127.0.0.1',
  1
FROM (
  SELECT 'CREAR_PAQUETE' AS codigo, 'Crear paquete en Enviatodo' AS descripcion, 1 AS orden
  UNION ALL
  SELECT 'LISTAR_PAQUETES', 'Listar paquetes de Enviatodo', 2
  UNION ALL
  SELECT 'VER_PAQUETE', 'Consultar paquete por id en Enviatodo', 3
  UNION ALL
  SELECT 'ELIMINAR_PAQUETE', 'Eliminar paquete de Enviatodo', 4
) AS x
LEFT JOIN accion a
  ON a.SUBMODULO_ID = @submodulo_id
 AND a.CODIGO = x.codigo
WHERE a.ID_ACCION IS NULL;

-- Asigna permisos base al rol superadmin (ID_ROL = 1), si existen.
INSERT IGNORE INTO rol_modulo (ROL_ID, MODULO_ID, FEC_ASIGNACION, CVE_USUARIO_ASIGNACION, DES_IP_ASIGNACION)
VALUES (1, @modulo_id, @hoy, 'SYSTEM', '127.0.0.1');

INSERT IGNORE INTO rol_submodulo (ROL_ID, SUBMODULO_ID, FEC_ASIGNACION, CVE_USUARIO_ASIGNACION, DES_IP_ASIGNACION)
VALUES (1, @submodulo_id, @hoy, 'SYSTEM', '127.0.0.1');

INSERT IGNORE INTO rol_accion (ROL_ID, ACCION_ID, FEC_ASIGNACION, CVE_USUARIO_ASIGNACION, DES_IP_ASIGNACION)
SELECT
  1,
  a.ID_ACCION,
  @hoy,
  'SYSTEM',
  '127.0.0.1'
FROM accion a
WHERE a.SUBMODULO_ID = @submodulo_id
  AND a.CODIGO IN ('CREAR_PAQUETE', 'LISTAR_PAQUETES', 'VER_PAQUETE', 'ELIMINAR_PAQUETE');