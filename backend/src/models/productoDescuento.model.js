const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductoDescuento = sequelize.define(
    'producto_descuento',
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
      cantidadMin: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidadMax: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipoDescuento: {
        type: DataTypes.ENUM('PORCENTAJE', 'MONTO', 'PRECIO_FIJO'),
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'producto_descuento',
      timestamps: true,
      underscored: false,
    }
  );

  return ProductoDescuento;
};
