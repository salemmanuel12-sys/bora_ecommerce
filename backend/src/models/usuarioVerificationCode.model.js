const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioVerificationCode = sequelize.define(
    'UsuarioVerificationCode',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      codeHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'code_hash',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'used_at',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'updated_at',
      },
    },
    {
      tableName: 'USUARIO_VERIFICATION_CODE',
      timestamps: false,
      underscored: true,
      indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
    }
  );

  return UsuarioVerificationCode;
};
