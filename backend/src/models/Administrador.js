const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Administrador = sequelize.define(
    'administrador',
    {
      NUM_ADMIN: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      UUID_ADMIN: {
        type: DataTypes.STRING(36),
        unique: true,
        allowNull: false,
      },
      NOMBRE: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      EMAIL: {
        type: DataTypes.STRING(150),
        unique: true,
        allowNull: false,
      },
      PASSWORD: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ROL_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ROL',
          key: 'ID_ROL',
        },
      },
      ESTADO: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      STATUS: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      EMAIL_VERIFICADO: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      CODIGO_VERIFICACION: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      INVITATION_TOKEN: {
        type: DataTypes.STRING(64),
        unique: true,
        allowNull: true,
      },
      INVITATION_EXPIRES: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      RESET_TOKEN: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      RESET_TOKEN_EXPIRA: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      PASSWORD_CAMBIO_PROPUESTA: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PASSWORD_CAMBIO_ESTADO: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: true,
      },
      PASSWORD_CAMBIO_FEC_SOLICITUD: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      PASSWORD_CAMBIO_HORA_SOLICITUD: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      PASSWORD_CAMBIO_FEC_RESOLUCION: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      PASSWORD_CAMBIO_HORA_RESOLUCION: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      PASSWORD_CAMBIO_SUPERADMIN: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      PASSWORD_CAMBIO_MOTIVO: {
        type: DataTypes.STRING(150),
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
        type: DataTypes.STRING(20),
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
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      DES_IP_ACTUALIZA: {
        type: DataTypes.STRING(45),
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
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      DES_IP_REACTIVA: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      DES_MOTIVO_REACTIVA: {
        type: DataTypes.STRING(150),
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
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      DES_IP_BAJA: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      DES_MOTIVO_BAJA: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
    },
    {
      tableName: 'administrador',
      timestamps: false,
      underscored: false,
    }
  );

  return Administrador;
};
