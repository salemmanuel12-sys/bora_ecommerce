-- Migration: ranking de productos + opiniones de usuarios
-- Target: MySQL 8+
-- Safe to run multiple times (idempotent checks via information_schema)

START TRANSACTION;

SET @db := DATABASE();

-- Add PRODUCTO.averageRating only if missing
SET @has_average_rating := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'PRODUCTO'
    AND COLUMN_NAME = 'averageRating'
);
SET @sql := IF(
  @has_average_rating = 0,
  'ALTER TABLE PRODUCTO ADD COLUMN averageRating DECIMAL(3,2) NOT NULL DEFAULT 0.00 AFTER status',
  'SELECT "PRODUCTO.averageRating already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add PRODUCTO.totalRatings only if missing
SET @has_total_ratings := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'PRODUCTO'
    AND COLUMN_NAME = 'totalRatings'
);
SET @sql := IF(
  @has_total_ratings = 0,
  'ALTER TABLE PRODUCTO ADD COLUMN totalRatings INT NOT NULL DEFAULT 0 AFTER averageRating',
  'SELECT "PRODUCTO.totalRatings already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS producto_opiniones (
  id INT NOT NULL AUTO_INCREMENT,
  productoId INT NOT NULL,
  userId INT NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(150) NULL,
  comment TEXT NULL,
  status ENUM('Pendiente','Aprobada','Rechazada') NOT NULL DEFAULT 'Pendiente',
  verifiedPurchase TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_producto_opiniones_producto_user (productoId, userId),
  KEY idx_producto_opiniones_producto_status (productoId, status),
  KEY idx_producto_opiniones_user (userId),
  CONSTRAINT fk_producto_opiniones_producto
    FOREIGN KEY (productoId) REFERENCES PRODUCTO(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_producto_opiniones_usuario
    FOREIGN KEY (userId) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_producto_opiniones_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recalculate ranking from approved opinions
UPDATE PRODUCTO p
LEFT JOIN (
  SELECT
    productoId,
    ROUND(AVG(rating), 2) AS avgRating,
    COUNT(*) AS totalCount
  FROM producto_opiniones
  WHERE status = 'Aprobada'
  GROUP BY productoId
) x ON x.productoId = p.id
SET
  p.averageRating = COALESCE(x.avgRating, 0.00),
  p.totalRatings = COALESCE(x.totalCount, 0);

COMMIT;
