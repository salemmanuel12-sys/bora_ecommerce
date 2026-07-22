const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Atributo = sequelize.define(
    'atributo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'atributos',
      timestamps: true,
      underscored: false,
    }
  );

  return Atributo;
};