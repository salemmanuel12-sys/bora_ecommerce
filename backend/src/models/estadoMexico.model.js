const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EstadoMexico = sequelize.define(
    'estadoMexico',
    {
      code: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false,
        field: 'codigo',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'nombre',
      },
    },
    {
      tableName: 'estados_mexico',
      timestamps: false,
    }
  );

  return EstadoMexico;
};
