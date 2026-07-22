const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AtributoValor = sequelize.define(
    'atributo_valor',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      atributoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      valor: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
    },
    {
      tableName: 'atributo_valores',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ['atributoId', 'valor'],
        },
      ],
    }
  );

  return AtributoValor;
};