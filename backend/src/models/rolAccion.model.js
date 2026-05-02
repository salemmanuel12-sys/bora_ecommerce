const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolAccion = sequelize.define(
    'RolAccion',
    {
      ID_ROL_ACCION: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ROL_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ACCION_ID: {
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
      tableName: 'ROL_ACCION',
      timestamps: false,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['ROL_ID', 'ACCION_ID'],
          name: 'UQ_RA_ROL_ACCION',
        },
        {
          fields: ['ACCION_ID'],
          name: 'IDX_RA_ACCION_ID',
        },
      ],
    }
  );

  return RolAccion;
};
