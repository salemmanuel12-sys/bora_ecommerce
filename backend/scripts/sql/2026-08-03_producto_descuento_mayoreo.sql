CREATE TABLE IF NOT EXISTS producto_descuento (
  id INT NOT NULL AUTO_INCREMENT,
  productoId INT NOT NULL,
  cantidadMin INT NOT NULL,
  cantidadMax INT NOT NULL,
  tipoDescuento ENUM('PORCENTAJE', 'MONTO', 'PRECIO_FIJO') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_producto_descuento_producto_id (productoId),
  KEY idx_producto_descuento_rango (productoId, cantidadMin, cantidadMax),
  CONSTRAINT fk_producto_descuento_producto
    FOREIGN KEY (productoId)
    REFERENCES producto (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
