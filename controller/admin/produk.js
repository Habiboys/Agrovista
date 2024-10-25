const { Produk } = require("../../models"); // Adjust the path according to your project structure
const QRCode = require("qrcode");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
// const upload = require("../../middleware/uploadFile");
const listProduk = async (req, res) => {
  try {
    // const jeniswisata = await jenis_wisata.findAll();
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1; // Get the page number from the query string
    const limit = 5; // Number of items per page
    const offset = (page - 1) * limit; // Calculate the offset

    const { rows: produk, count: totalItems } = await Produk.findAndCountAll({
      limit,
      offset,
    });
    const totalPages = Math.ceil(totalItems / limit);
    res.render("produk", {
      produk,
      userId,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
};

const tambah = async (req, res) => {
  const kategoriEnum = Produk.rawAttributes.kategori.values;
  res.render("addproduk", { title: "Tambah Produk", kategoriEnum });
};

const qrcodeDir = path.join(__dirname, "../../", "qrcodes");
if (!fs.existsSync(qrcodeDir)) {
  fs.mkdirSync(qrcodeDir, { recursive: true });
}

const simpan = async (req, res) => {
  try {
    const { nama, kategori, komposisi, deskripsi, status_halal } = req.body;

    // Memastikan bahwa file gambar telah diunggah (gambar wajib)
    if (!req.files || !req.files.gambar) {
      return res.status(400).json({ message: "Gambar produk harus diunggah!" });
    }

    const gambar = req.files.gambar[0].filename; // Mendapatkan path gambar dari multer

    // Sertifikasi halal opsional
    const sertifikasi_halal = req.files.sertifikasi_halal
      ? req.files.sertifikasi_halal[0].filename
      : null; // Jika sertifikasi tidak ada, biarkan null

    // Memeriksa jika field lain tidak ada
    if (!nama || !kategori || !deskripsi || !komposisi || !status_halal) {
      return res.status(400).json({
        message:
          "Nama, kategori, deskripsi, komposisi, dan status halal tidak boleh kosong",
      });
    }

    // Simpan data produk ke database
    const produk = await Produk.create({
      nama,
      kategori,
      komposisi,
      deskripsi,
      status_halal,
      gambar, // Simpan path gambar yang diunggah
      sertifikasi_halal, // Jika ada, simpan path sertifikasi halal yang diunggah, jika tidak, biarkan null
    });

    // Generate hash dari ID produk
    const hash = crypto
      .createHash("sha256")
      .update(produk.id.toString())
      .digest("hex");

    // Generate QR code yang mengarah ke detail produk
    const qrCodeUrl = `http://localhost:3000/detail-produk/${hash}`;
    const qrCodeFilePath = path.join(qrcodeDir, `${produk.id}.png`); // Path untuk menyimpan QR code

    // Simpan QR code sebagai file PNG
    await QRCode.toFile(qrCodeFilePath, qrCodeUrl);

    // Simpan path QR code di database
    qrBaru = `${produk.id}.png`; // Simpan nama file QR code ke dalam produk

    // Update produk di database dengan path QR code
    await Produk.update(
      { qr_code: qrBaru, hashId: hash },
      { where: { id: produk.id } }
    );

    console.log("QR Code:", qrBaru);

    res.status(201).json({
      message: "Produk berhasil ditambahkan",
      produk: {
        ...produk.toJSON(),
      },
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
};

const edit = async (req, res) => {
  try {
    const id = req.params.id;
    const produk = await Produk.findByPk(id);

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const kategoriEnum = Produk.rawAttributes.kategori.values;
    res.render("editproduk", { title: "Edit Produk", produk, kategoriEnum });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
};

const update = async (req, res) => {
  try {
    const id = req.params.id;
    const { nama, kategori, deskripsi } = req.body;

    // Memeriksa apakah file gambar diunggah
    const gambar = req.file ? req.file.filename : null; // Mendapatkan path gambar dari multer jika ada

    // Mendapatkan data produk yang ada di database
    const existingProduk = await Produk.findByPk(id);

    if (!existingProduk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // Update data produk di database
    const updatedData = {
      nama: nama || existingProduk.nama, // Jika nama tidak diisi, gunakan data yang sudah ada
      kategori: kategori || existingProduk.kategori, // Jika kategori tidak diisi, gunakan data yang sudah ada
      deskripsi: deskripsi || existingProduk.deskripsi, // Jika deskripsi tidak diisi, gunakan data yang sudah ada
      gambar: gambar || existingProduk.gambar, // Jika gambar tidak diunggah, gunakan gambar yang sudah ada
    };

    await Produk.update(updatedData, {
      where: { id },
    });

    res.status(200).json({ message: "Produk berhasil diperbarui" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi kesalahan", error });
  }
};

const hapus = async (req, res) => {
  try {
    const id = req.params.id;

    // Hapus data produk dari database berdasarkan ID
    const produk = await Produk.findByPk(id);
    if (!produk) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });
    }

    await produk.destroy();

    res.status(200).json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan" });
  }
};
const detail = async (req, res) => {
  try {
    const hashId = req.params.hashId;

    // Cari produk berdasarkan hashId
    const produk = await Produk.findOne({ where: { hashId } });

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    // Render halaman detail produk dengan data produk
    res.render("detailproduk", { produk });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
};

module.exports = {
  listProduk,
  edit,
  update,
  tambah,
  simpan,
  hapus,
  detail,
};
