"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class DataUlasan extends Model {
    static associate(models) {
      DataUlasan.belongsTo(models.jenis_wisata, {
        // Define the association
        foreignKey: "jenisWisataId",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        as: "jenisWisata", // Optional: Alias for the association
      });
    }
  }

  DataUlasan.init(
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
      umur: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jenis_kelamin: {
        type: DataTypes.ENUM("P", "L"),
        allowNull: false,
      },
      pekerjaan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      asal: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ulasan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      label: {
        type: DataTypes.ENUM("Negatif", "Positif", "Netral"),
        allowNull: true,
      },
      kluster: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jenisWisataId: {
        // Foreign key to jenis_wisata
        type: DataTypes.INTEGER,
        references: {
          model: "jenis_wisata",
          key: "id",
        },
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DataUlasan", // Use the proper model name
      tableName: "dataulasans",
      timestamps: true,
    }
  );

  return DataUlasan; // Return the model
};
