const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolSubmodulo = sequelize.define(
    'RolSubmodulo',
    {
      ID_ROL_SUBMODULO: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ROL_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SUBMODULO_ID: {
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
      tableName: 'rol_submodulo',
      timestamps: false,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['ROL_ID', 'SUBMODULO_ID'],
          name: 'UQ_RSM_ROL_SUBMOD',
        },
        {
          fields: ['SUBMODULO_ID'],
          name: 'IDX_RSM_SUBMOD_ID',
        },
      ],
    }
  );

  return RolSubmodulo;
};
