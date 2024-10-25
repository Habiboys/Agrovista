'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DataUlasan extends Model {
    static associate(models) {
      DataUlasan.belongsTo(models.DataDiri, { foreignKey: 'id_data_diri' });
    //   DataUlasan.belongsTo(models.JenisWisata, { foreignKey: 'jenisWisataId' });
      DataUlasan.belongsTo(models.JenisWisata, { 
        foreignKey: 'jenisWisataId', 
        as: 'jenisWisata' // Tambahkan alias di sini
      });
      
    }
  }

  DataUlasan.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_data_diri: {
      type: DataTypes.INTEGER,
      references: {
        model: 'DataDiri',
        key: 'id',
      },
      allowNull: true,
    },
    jenisWisataId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'JenisWisata',
        key: 'id',
      },
      allowNull: true,
    },
    ulasan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    label: {
      type: DataTypes.ENUM('Negatif', 'Positif', 'Netral'),
      allowNull: true,
    },
    point: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
  }, {
    sequelize,
    modelName: 'DataUlasan',
    tableName: 'data_ulasan',
    timestamps: true,
  });

  return DataUlasan;
};
