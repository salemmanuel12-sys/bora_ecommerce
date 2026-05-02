const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Shipment = sequelize.define(
    'Shipment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      carrier: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      trackingNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Pendiente', 'Enviado', 'En tránsito', 'Entregado'),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      shippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'shipments',
      timestamps: true,
      updatedAt: false,
    }
  );

  return Shipment;
};
