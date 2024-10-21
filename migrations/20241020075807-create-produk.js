"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Produks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nama: {
        type: Sequelize.STRING,
      },
      gambar: {
        type: Sequelize.STRING,
      },
      kategori: {
        type: Sequelize.ENUM("Makanan", "Minuman"),
      },
      komposisi: {
        type: Sequelize.TEXT,
      },
      deskripsi: {
        type: Sequelize.TEXT,
      },
      status_halal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, // Default tidak halal (belum disertifikasi)
      },
      sertifikasi_halal: {
        type: Sequelize.STRING,
      },
      hashId: {
        type: Sequelize.TEXT,
      },
      qr_code: {
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
    await queryInterface.dropTable("Produks");
  },
};
