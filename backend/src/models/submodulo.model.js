const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Submodulo = sequelize.define(
    'submodulo',
    {
      ID_SUBMODULO: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      UUID_SUBMODULO: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      MODULO_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      CODIGO: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      DESCRIPCION: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ORDEN: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      FEC_ALTA: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      HORA_ALTA: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      CVE_USUARIO_ALTA: {
        type: DataTypes.STRING(12),
        allowNull: true,
      },
      DES_IP_ALTA: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      FEC_ACTUALIZA: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      HORA_ACTUALIZA: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      CVE_USUARIO_ACTUALIZA: {
        type: DataTypes.STRING(12),
        allowNull: true,
      },
      DES_IP_ACTUALIZA: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      FEC_BAJA: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      HORA_BAJA: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      CVE_USUARIO_BAJA: {
        type: DataTypes.STRING(12),
        allowNull: true,
      },
      DES_IP_BAJA: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      DES_MOTIVO_BAJA: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      FEC_REACTIVA: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      HORA_REACTIVA: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      CVE_USUARIO_REACTIVA: {
        type: DataTypes.STRING(12),
        allowNull: true,
      },
      DES_IP_REACTIVA: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      DES_MOTIVO_REACTIVA: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ESTADO: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: 'submodulo',
      timestamps: false,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['MODULO_ID', 'CODIGO'],
          name: 'UQ_MODULO_CODIGO',
        },
        {
          fields: ['MODULO_ID', 'ESTADO'],
          name: 'IDX_SUBMOD_MODULO_ESTADO',
        },
      ],
    }
  );

  return Submodulo;
};
