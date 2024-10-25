'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DataDiri extends Model {
    static associate(models) {
      DataDiri.belongsTo(models.User, { foreignKey: 'id_user' });
      DataDiri.hasMany(models.DataUlasan, { foreignKey: 'id_data_diri', onDelete: 'CASCADE' });
    }
  }

  DataDiri.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      references: {
        model: 'User',
        key: 'id',
      },
      allowNull: true,
    },
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    umur: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jenis_kelamin: {
      type: DataTypes.ENUM('Laki-laki', 'Perempuan'),
      allowNull: false,
    },
    pekerjaan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    asal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'DataDiri',
    tableName: 'data_diri',
    timestamps: true,
  });

  return DataDiri;
};
