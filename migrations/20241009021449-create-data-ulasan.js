"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DataUlasans", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama: {
        type: Sequelize.STRING,
      },
      umur: {
        type: Sequelize.INTEGER,
      },
      jenis_kelamin: {
        type: Sequelize.ENUM("P", "L"),
      },
      pekerjaan: {
        type: Sequelize.STRING,
      },
      asal: {
        type: Sequelize.STRING,
      },
      jenisWisataId: {
        // Foreign key to jenis_wisata
        type: Sequelize.INTEGER,
        references: {
          model: "jenis_wisata",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      ulasan: {
        type: Sequelize.TEXT,
      },
      label: {
        type: Sequelize.ENUM("Negatif", "Positif", "Netral"),
      },
      kluster: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("DataUlasans");
  },
};
