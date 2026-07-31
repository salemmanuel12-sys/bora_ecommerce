ALTER TABLE addresses
  ADD COLUMN stateCode VARCHAR(2) NULL AFTER state;

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS address_id_enviatodo VARCHAR(20) NULL AFTER stateCode;
