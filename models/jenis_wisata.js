'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JenisWisata extends Model {
    static associate(models) {
      // Relasi ke DataUlasan
      JenisWisata.hasMany(models.DataUlasan, { foreignKey: 'jenisWisataId' });
    }
  }

  JenisWisata.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
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
    modelName: 'JenisWisata',
    tableName: 'jenis_wisata',
    timestamps: true,
  });

  return JenisWisata;
};
