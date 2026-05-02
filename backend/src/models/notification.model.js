const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = notificación para el administrador (sin usuario asociado)
      },
      type: {
        type: DataTypes.ENUM(
          'Nuevo pedido',
          'Pago confirmado',
          'Enviado',
          'Entregado',
          'Cancelado'
        ),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      updatedAt: false,
    }
  );

  return Notification;
};
