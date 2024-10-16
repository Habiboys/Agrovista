'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jenis_wisata extends Model {
    static associate(models) {
      jenis_wisata.hasMany(models.DataUlasan, {
        foreignKey: 'jenisWisataId',
        as: 'ulasans', // Optional: Alias for the association
      });
    }
  }
  jenis_wisata.init({
    nama_wisata: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gambar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'jenis_wisata',
  });
  return jenis_wisata;
};