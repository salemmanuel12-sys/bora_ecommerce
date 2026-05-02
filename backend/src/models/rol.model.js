const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rol = sequelize.define(
    'Rol',
    {
      ID_ROL: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      UUID_ROL: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      NOMBRE_ROL: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      DESCRIPCION: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: 'ROL',
      timestamps: false,
      underscored: false,
    }
  );

  return Rol;
};