require('./config/env');

const { sequelize } = require('./config/db');

// 🔥 INICIALIZA MODELOS ANTES DE CUALQUIER REQUIRE
require('./models/loader');

const app = require('./app'); // 👈 después de modelos
const { testDatabaseConnection } = require('./config/db');

const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en puerto ${PORT}`);
    });

  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();