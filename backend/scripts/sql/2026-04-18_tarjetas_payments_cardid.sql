-- Migration: tarjetas + payments.cardId
-- Target: MySQL 8+
-- Safe to run multiple times (idempotent checks via information_schema)

START TRANSACTION;

CREATE TABLE IF NOT EXISTS tarjetas (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  holderName VARCHAR(120) NOT NULL,
  brand VARCHAR(30) NOT NULL,
  last4 VARCHAR(4) NOT NULL,
  expMonth INT NOT NULL,
  expYear INT NOT NULL,
  fingerprintHash VARCHAR(128) NOT NULL,
  encryptedPan TEXT NOT NULL,
  panIv VARCHAR(128) NOT NULL,
  panAuthTag VARCHAR(128) NOT NULL,
  encryptedCvv TEXT NOT NULL,
  cvvIv VARCHAR(128) NOT NULL,
  cvvAuthTag VARCHAR(128) NOT NULL,
  isDefault TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tarjetas_userId (userId),
  UNIQUE KEY uk_tarjetas_user_fingerprint (userId, fingerprintHash),
  CONSTRAINT fk_tarjetas_usuario
    FOREIGN KEY (userId) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add payments.cardId only if missing
SET @db := DATABASE();
SET @has_cardId := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'cardId'
);
SET @sql := IF(
  @has_cardId = 0,
  'ALTER TABLE payments ADD COLUMN cardId INT NULL AFTER orderId',
  'SELECT "payments.cardId already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on payments.cardId only if missing
SET @has_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'payments'
    AND INDEX_NAME = 'idx_payments_cardId'
);
SET @sql := IF(
  @has_idx = 0,
  'CREATE INDEX idx_payments_cardId ON payments(cardId)',
  'SELECT "idx_payments_cardId already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add FK payments.cardId -> tarjetas.id only if missing
SET @has_fk := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS tc
  WHERE tc.TABLE_SCHEMA = @db
    AND tc.TABLE_NAME = 'payments'
    AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND tc.CONSTRAINT_NAME = 'fk_payments_tarjeta'
);
SET @sql := IF(
  @has_fk = 0,
  'ALTER TABLE payments ADD CONSTRAINT fk_payments_tarjeta FOREIGN KEY (cardId) REFERENCES tarjetas(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "fk_payments_tarjeta already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
