"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Pelaporan extends Model {
    static associate(models) {
      // Relasi ke tabel DataDiri
      Pelaporan.belongsTo(models.DataDiri, {
        foreignKey: "id_data_diri",
        as: "DataDiri",
      });
    }
  }

  Pelaporan.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_data_diri: {
        type: DataTypes.INTEGER,
        references: {
          model: "DataDiri", // Nama tabel yang ada
          key: "id",
        },
        allowNull: false, // Sesuaikan apakah boleh NULL atau tidak
      },
      judul: {
        type: DataTypes.STRING,
        allowNull: false, // Kolom judul wajib diisi
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true, // Kolom deskripsi bisa kosong
      },
      gambar: {
        type: DataTypes.STRING, // Menyimpan path atau URL gambar
        allowNull: true, // Kolom gambar bisa kosong
      },
      point: {
        type: DataTypes.INTEGER,
        allowNull: true, // Kolom point bisa kosong
      },
    },
    {
      sequelize,
      modelName: "Pelaporan",
      tableName: "pelaporan",
      timestamps: true,
    }
  );

  return Pelaporan;
};
