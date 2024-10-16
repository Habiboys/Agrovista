'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('jenis_wisata', [
      {
        nama_wisata: 'Wisata Kebun Buah',
        gambar: null, // Add image URL if available
        deskripsi: 'Menikmati keindahan kebun buah dan belajar tentang budidaya tanaman.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama_wisata: 'Wisata Peternakan',
        gambar: null, // Add image URL if available
        deskripsi: 'Pengalaman langsung di peternakan dengan berbagai hewan.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama_wisata: 'Wisata Pertanian Padi',
        gambar: null, // Add image URL if available
        deskripsi: 'Menjelajahi proses pertanian padi dari awal hingga panen.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama_wisata: 'Wisata Perikanan',
        gambar: null, // Add image URL if available
        deskripsi: 'Belajar tentang budidaya ikan dan teknik perikanan yang berkelanjutan.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nama_wisata: 'Wisata Agro Edukasi',
        gambar: null, // Add image URL if available
        deskripsi: 'Program edukasi tentang pertanian dan lingkungan hidup.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('jenis_wisata', null, {});
  },
};
