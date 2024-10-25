'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('data_ulasan', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_data_diri: {
        type: Sequelize.INTEGER,
        references: {
          model: 'data_diri', // Pastikan nama tabel sama dengan yang ada di database
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      jenisWisataId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'jenis_wisata', // Nama tabel sesuai dengan tabel di database
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      ulasan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      label: {
        type: Sequelize.ENUM('Negatif', 'Positif', 'Netral'),
        allowNull: true,
      },
      point: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('data_ulasan');
  }
};
