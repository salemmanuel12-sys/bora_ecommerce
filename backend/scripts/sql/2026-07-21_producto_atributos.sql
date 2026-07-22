-- Migration: atributos de productos
-- Target: MySQL 8+
-- Safe to run multiple times (idempotent checks via information_schema)

START TRANSACTION;

CREATE TABLE IF NOT EXISTS atributos (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_atributos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS atributo_valores (
  id INT NOT NULL AUTO_INCREMENT,
  atributoId INT NOT NULL,
  valor VARCHAR(120) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_atributo_valores_atributo_valor (atributoId, valor),
  KEY idx_atributo_valores_atributoId (atributoId),
  CONSTRAINT fk_atributo_valores_atributo
    FOREIGN KEY (atributoId) REFERENCES atributos(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS producto_atributos (
  id INT NOT NULL AUTO_INCREMENT,
  productoId INT NOT NULL,
  atributoId INT NOT NULL,
  valorId INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_producto_atributos_producto_atributo_valor (productoId, atributoId, valorId),
  KEY idx_producto_atributos_productoId (productoId),
  KEY idx_producto_atributos_atributoId (atributoId),
  KEY idx_producto_atributos_valorId (valorId),
  CONSTRAINT fk_producto_atributos_producto
    FOREIGN KEY (productoId) REFERENCES producto(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_producto_atributos_atributo
    FOREIGN KEY (atributoId) REFERENCES atributos(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_producto_atributos_valor
    FOREIGN KEY (valorId) REFERENCES atributo_valores(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;