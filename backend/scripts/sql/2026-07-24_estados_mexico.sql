CREATE TABLE IF NOT EXISTS estados_mexico (
  codigo CHAR(2) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (codigo),
  UNIQUE KEY uk_estados_mexico_nombre (nombre)
);

INSERT INTO estados_mexico (codigo, nombre)
VALUES
  ('AS', 'Aguascalientes'),
  ('BC', 'Baja California'),
  ('BS', 'Baja California Sur'),
  ('CC', 'Campeche'),
  ('CL', 'Coahuila'),
  ('CM', 'Colima'),
  ('CS', 'Chiapas'),
  ('CH', 'Chihuahua'),
  ('DF', 'Ciudad de Mexico'),
  ('DG', 'Durango'),
  ('GT', 'Guanajuato'),
  ('GR', 'Guerrero'),
  ('HG', 'Hidalgo'),
  ('JC', 'Jalisco'),
  ('MC', 'Mexico'),
  ('MN', 'Michoacan'),
  ('MS', 'Morelos'),
  ('NT', 'Nayarit'),
  ('NL', 'Nuevo Leon'),
  ('OC', 'Oaxaca'),
  ('PL', 'Puebla'),
  ('QO', 'Queretaro'),
  ('QR', 'Quintana Roo'),
  ('SP', 'San Luis Potosi'),
  ('SL', 'Sinaloa'),
  ('SR', 'Sonora'),
  ('TC', 'Tabasco'),
  ('TS', 'Tamaulipas'),
  ('TL', 'Tlaxcala'),
  ('VZ', 'Veracruz'),
  ('YN', 'Yucatan'),
  ('ZS', 'Zacatecas')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre);
