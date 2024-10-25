const { JenisWisata } = require("../../models"); // Adjust the path according to your project structure
const daftarWisata = async (req, res) => {
    try {
      const userId = req.session.userId;
      const page = parseInt(req.query.page) || 1; // Get the page number from the query string
      const limit = 5; // Number of items per page
      const offset = (page - 1) * limit; // Calculate the offset
  
      const { rows: jeniswisata, count: totalItems } =
        await JenisWisata.findAndCountAll({
          limit,
          offset,
        });
      const totalPages = Math.ceil(totalItems / limit);
      res.render("jeniswisata", {
        title: "Jenis Wisata",
        jeniswisata,
        userId,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      next(error);
    }
  }

  const simpan= async (req, res) => {
    try {
      const { nama_wisata, deskripsi } = req.body;
  
      // Memastikan bahwa file gambar telah diunggah
      if (!req.file) {
        return res.status(400).json({ message: "Gambar harus diunggah!" });
      }
  
      const gambar = req.file.filename; // Mendapatkan path gambar dari multer
  
      // Memeriksa jika field lain tidak ada
      if (!nama_wisata || !deskripsi) {
        return res
          .status(400)
          .json({ message: "Nama wisata dan deskripsi harus diisi!" });
      }
  
      // Simpan data wisata ke database
      const wisata = await JenisWisata.create({
        nama_wisata,
        deskripsi,
        gambar: gambar, // Simpan path gambar yang diunggah
      });
  
      res.status(201).json({ message: "Wisata berhasil ditambahkan", wisata });
    } catch (error) {
      console.error("Error: ", error.message);
      res.status(500).json({ message: "Terjadi Kesalahan", error });
    }
  }

  const edit = async (req, res) => {
    try {
      const id = req.params.id;
      const wisata = await JenisWisata.findByPk(id);
  
      if (!wisata) {
        return res.status(404).json({ message: "Wisata tidak ditemukan" });
      }
  
      res.render("editwisata", { title: "Edit Wisata", wisata });
    } catch (error) {
      console.error("Error: ", error.message);
      res.status(500).json({ message: "Terjadi Kesalahan", error });
    }
  }
  const update = async (req, res) => {
    try {
      const id = req.params.id;
      const { nama_wisata, deskripsi } = req.body;

      // Memeriksa apakah file gambar diunggah
      const gambar = req.file ? req.file.filename : null; // Mendapatkan path gambar dari multer jika ada

      // Mendapatkan data wisata yang ada di database
      const existingWisata = await JenisWisata.findByPk(id);

      if (!existingWisata) {
        return res.status(404).json({ message: "Wisata tidak ditemukan" });
      }

      // Update data wisata di database
      const updatedData = {
        nama_wisata: nama_wisata || existingWisata.nama_wisata, // Jika nama_wisata tidak diisi, gunakan data yang sudah ada
        deskripsi: deskripsi || existingWisata.deskripsi, // Jika deskripsi tidak diisi, gunakan data yang sudah ada
        gambar: gambar || existingWisata.gambar, // Jika gambar tidak diunggah, gunakan gambar yang sudah ada
      };

      await JenisWisata.update(updatedData, {
        where: { id },
      });

      res.status(200).json({ message: "Wisata berhasil diperbarui" });
    } catch (error) {
      console.error("Error: ", error.message);
      res.status(500).json({ message: "Terjadi kesalahan", error });
    }
  }
  const hapus = async (req, res) => {
    try {
      const id = req.params.id;
  
      // Hapus data wisata dari database berdasarkan ID
      const wisata = await JenisWisata.findByPk(id);
      if (!wisata) {
        return res
          .status(404)
          .json({ success: false, message: "Wisata tidak ditemukan" });
      }
  
      await wisata.destroy();
  
      res.status(200).json({ success: true, message: "Wisata berhasil dihapus" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan" });
    }
  }

  module.exports={
    daftarWisata,
    simpan,
    edit,
    update,
    hapus
  }