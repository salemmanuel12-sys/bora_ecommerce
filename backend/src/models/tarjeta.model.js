const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tarjeta = sequelize.define(
    'Tarjeta',
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
      holderName: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      brand: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      last4: {
        type: DataTypes.STRING(4),
        allowNull: false,
      },
      expMonth: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fingerprintHash: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      encryptedPan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      panIv: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      panAuthTag: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      encryptedCvv: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      cvvIv: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      cvvAuthTag: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'tarjetas',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['userId'] },
        { unique: true, fields: ['userId', 'fingerprintHash'] },
      ],
    }
  );

  return Tarjeta;
};
