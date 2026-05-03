const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminResetCode = sequelize.define(
    'AdminResetCode',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'admin_id',
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
      tableName: 'admin_reset_codes',
      timestamps: false,
      underscored: true,
      indexes: [{ fields: ['admin_id'] }, { fields: ['expires_at'] }],
    }
  );

  return AdminResetCode;
};
