const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    'cart',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Activo', 'Abandonado', 'Convertido'),
        allowNull: false,
        defaultValue: 'Activo',
      },
    },
    {
      tableName: 'carts',
      timestamps: true,
      updatedAt: false,
    }
  );

  return Cart;
};
