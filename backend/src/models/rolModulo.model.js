const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolModulo = sequelize.define(
    'rol_modulo',
    {
      ID_ROL_MODULO: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ROL_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      MODULO_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      FEC_ASIGNACION: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      CVE_USUARIO_ASIGNACION: {
        type: DataTypes.STRING(12),
        allowNull: true,
      },
      DES_IP_ASIGNACION: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      tableName: 'rol_modulo',
      timestamps: false,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['ROL_ID', 'MODULO_ID'],
          name: 'UQ_RM_ROL_MODULO',
        },
        {
          fields: ['MODULO_ID'],
          name: 'IDX_RM_MODULO_ID',
        },
      ],
    }
  );

  return RolModulo;
};
