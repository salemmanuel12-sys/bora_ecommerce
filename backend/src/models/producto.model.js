const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Producto = sequelize.define(
    'producto',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      peso: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      alto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      ancho: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      largo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      totalRatings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'producto',
      timestamps: true,
      underscored: false,
    }
  );

  return Producto;
};
