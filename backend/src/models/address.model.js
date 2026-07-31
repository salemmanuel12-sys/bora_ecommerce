const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Address = sequelize.define(
    'address',
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
      address_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      street: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ext_number: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      int_number: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      stateCode: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      postalCode: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'México',
      },
      references: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address_id_enviatodo: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    },
    {
      tableName: 'addresses',
      timestamps: true,
      updatedAt: false,
    }
  );

  return Address;
};
