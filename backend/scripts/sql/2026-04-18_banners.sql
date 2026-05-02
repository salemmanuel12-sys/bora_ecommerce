-- Migration: banners de anuncios/ofertas
-- Target: MySQL 8+

START TRANSACTION;

CREATE TABLE IF NOT EXISTS banners (
  id INT NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL,
  title VARCHAR(140) NOT NULL,
  description VARCHAR(280) NULL,
  imageUrl VARCHAR(500) NOT NULL,
  ctaText VARCHAR(80) NULL,
  ctaLink VARCHAR(500) NULL,
  orden INT NOT NULL DEFAULT 0,
  status TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_banners_uuid (uuid),
  KEY idx_banners_status_orden (status, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
