const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'order',
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
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      shippingCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      paymentStatus: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Fallido'),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      shippingAddressId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      updatedAt: false,
    }
  );

  return Order;
};
