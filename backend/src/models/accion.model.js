const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Accion = sequelize.define(
    'Accion',
    {
      ID_ACCION: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      UUID_ACCION: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      SUBMODULO_ID: {
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
      tableName: 'accion',
      timestamps: false,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['SUBMODULO_ID', 'CODIGO'],
          name: 'UQ_SUBMOD_CODIGO_ACCION',
        },
        {
          fields: ['SUBMODULO_ID', 'ESTADO'],
          name: 'IDX_ACCION_SUBMOD_ESTADO',
        },
      ],
    }
  );

  return Accion;
};
