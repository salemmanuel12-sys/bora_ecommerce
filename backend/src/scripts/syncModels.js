

const { sequelize } = require('../config/db');

const NON_MODEL_EXPORTS = ['sequelize'];

async function syncModels() {
  try {
    // Register all models and associations before sync.
    const models = require('../models/loader');

    const requiredModels = Object.keys(models)
      .filter((key) => !NON_MODEL_EXPORTS.includes(key))
      .sort((left, right) => left.localeCompare(right));

    const missingModels = requiredModels.filter((modelName) => !models[modelName]);
    if (missingModels.length > 0) {
      throw new Error(`Faltan modelos por registrar: ${missingModels.join(', ')}`);
    }

    const useAlter = process.argv.includes('--alter');

    await sequelize.sync({ alter: useAlter });
    console.log(`Modelos validados (${requiredModels.length}): ${requiredModels.join(', ')}`);
    console.log(
      useAlter
        ? 'Modelos sincronizados con alter correctamente en la base de datos.'
        : 'Modelos sincronizados correctamente en la base de datos.'
    );
  } catch (error) {
    console.error('Error al sincronizar modelos:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch (_error) {
      // no-op
    }
  }
}

syncModels();
