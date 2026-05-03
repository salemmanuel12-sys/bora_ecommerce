const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Banner = sequelize.define(
    'banner',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(140),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(280),
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      ctaText: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      ctaLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'banners',
      timestamps: true,
      underscored: false,
    }
  );

  return Banner;
};
