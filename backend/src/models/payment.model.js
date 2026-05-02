const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    'Payment',
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
      cardId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      method: {
        type: DataTypes.ENUM('Tarjeta', 'Transferencia', 'Efectivo'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
      updatedAt: false,
    }
  );

  return Payment;
};
