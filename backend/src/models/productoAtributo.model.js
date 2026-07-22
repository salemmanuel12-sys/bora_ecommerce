const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductoAtributo = sequelize.define(
    'producto_atributo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      atributoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      valorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'producto_atributos',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['productoId', 'atributoId', 'valorId'],
        },
        {
          fields: ['productoId'],
        },
      ],
    }
  );

  return ProductoAtributo;
};