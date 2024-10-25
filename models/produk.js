"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Produk extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Produk.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kategori: {
        type: DataTypes.ENUM("Makanan", "Minuman"),
        allowNull: false,
      },
      gambar: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      komposisi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status_halal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sertifikasi_halal: {
        type: DataTypes.STRING,
      },
      hashId: {
        type: DataTypes.TEXT,
      },
      qr_code: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Produk",
      tableName: 'produk',
    }
  );
  return Produk;
};
