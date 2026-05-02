require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const app = require('./app');
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
