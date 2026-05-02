require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { Administrador, Rol } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexión exitosa.');

    // Si ROL fue creada con columnas deformadas por underscored+MAYUSCULAS, se recrea.
    const [rolExistsRows] = await sequelize.query("SHOW TABLES LIKE 'rol'");
    if (rolExistsRows.length > 0) {
      const [rolColumns] = await sequelize.query('DESCRIBE rol');
      const hasBrokenPk = rolColumns.some((col) => col.Field === 'i_d__r_o_l');
      if (hasBrokenPk) {
        console.log('Detectada tabla rol con columnas inválidas. Recreando...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.query('DROP TABLE rol');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      }
    }

    // Deshabilitar FK checks para sincronizar sin conflictos de orden
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: false });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Auto-migracion minima para esquemas existentes sin UUID_ROL.
    const [rolColumnsAfterSync] = await sequelize.query('DESCRIBE ROL');
    const hasUuidRol = rolColumnsAfterSync.some((col) => col.Field === 'UUID_ROL');
    if (!hasUuidRol) {
      await sequelize.query('ALTER TABLE ROL ADD COLUMN UUID_ROL CHAR(36) NULL UNIQUE');
      await sequelize.query('UPDATE ROL SET UUID_ROL = UUID() WHERE UUID_ROL IS NULL');
      await sequelize.query('ALTER TABLE ROL MODIFY UUID_ROL CHAR(36) NOT NULL');
      console.log('Columna UUID_ROL agregada y poblada en ROL.');
    }

    console.log('Tablas sincronizadas.');

    // Crear o encontrar rol superadmin
    const [rol] = await Rol.findOrCreate({
      where: { NOMBRE_ROL: 'superadmin' },
      defaults: {
        UUID_ROL: uuidv4(),
        NOMBRE_ROL: 'superadmin',
        DESCRIPCION: 'Super administrador con acceso total',
        ESTADO: 1,
      },
    });
    console.log(`Rol superadmin ID: ${rol.ID_ROL}`);

    const email = 'salemmanuel12@gmail.com';
    const hashedPassword = await bcrypt.hash('elcarro12', 12);

    // Deshabilitar FK para insertar sin problema de referencia rota
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const [admin, created] = await Administrador.findOrCreate({
      where: { EMAIL: email },
      defaults: {
        UUID_ADMIN: uuidv4(),
        NOMBRE: 'Super Admin',
        EMAIL: email,
        PASSWORD: hashedPassword,
        ROL_ID: rol.ID_ROL,
        ESTADO: 1,
        STATUS: 'approved',
        EMAIL_VERIFICADO: true,
      },
    });

    if (!created) {
      await admin.update({
        PASSWORD: hashedPassword,
        ROL_ID: rol.ID_ROL,
        ESTADO: 1,
        STATUS: 'approved',
        EMAIL_VERIFICADO: true,
      });
      console.log('Superadmin ya existía, se actualizó.');
    } else {
      console.log('Superadmin creado exitosamente.');
    }

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`\nCredenciales:`);
    console.log(`  Email: ${email}`);
    console.log(`  Contraseña: elcarro12`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

seed();
