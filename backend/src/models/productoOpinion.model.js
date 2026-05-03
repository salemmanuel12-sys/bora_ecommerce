const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductoOpinion = sequelize.define(
    'producto_opinion',
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Pendiente', 'Aprobada', 'Rechazada'),
        allowNull: false,
        defaultValue: 'Pendiente',
      },
      verifiedPurchase: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'producto_opiniones',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['productoId', 'userId'],
        },
        {
          fields: ['productoId', 'status'],
        },
      ],
    }
  );

  return ProductoOpinion;
};
