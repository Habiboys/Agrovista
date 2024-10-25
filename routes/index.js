const ulasan = require("../controller/admin/ulasan");
const dashboard = require("../controller/admin/dashboard");
const produk = require("../controller/admin/produk");
const wisata = require("../controller/admin/wisata");
const monitoring = require("../controller/admin/monitoring");

var express = require("express");
var router = express.Router();
require("dotenv").config();
const upload = require("../middleware/uploadFile");
const {
  DataUlasan,
  JenisWisata,
  Produk,
  User,
  DataDiri,
} = require("../models"); // Adjust the path according to your project structure
const axios = require("axios");

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect("/auth/login");
  }
}

router.get("/", async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  const total_ulasan = await DataUlasan.count();
  const total_wisata = await JenisWisata.count();
  const jenisWisata = await JenisWisata.findAll({
    limit: 4,
    order: [["createdAt", "DESC"]],
  });
  const total_produk = await Produk.count();
  const dataUlasan = await DataUlasan.findAll({
    limit: 3,
    order: [["createdAt", "DESC"]],
  });
  res.render("index", {
    title: "AgroWista",
    total_ulasan,
    total_wisata,
    total_produk,
    jenisWisata,
    dataUlasan,
    user,
  });
});

// Route to display 'Ulasan' page and log data from 'data_ulasan' table
router.get("/ulasan", async function (req, res, next) {
  try {
    // Fetch all records from the DataUlasan table
    const ulasanData = await DataUlasan.findAll();
    const jenisWisata = await JenisWisata.findAll();
    const user = await User.findByPk(req.session.userId, {
      include: [
        {
          model: DataDiri,
        },
      ],
    });

    // Render the 'ulasan' view and pass the data to it if needed
    res.render("ulasan", {
      title: "Ulasan",
      data: ulasanData,
      jenisWisata,
      user,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
});
router.get("/profile", async function (req, res, next) {
  try {
    const user = await User.findByPk(req.session.userId, {
      include: [
        {
          model: DataDiri,
        },
      ],
    });
    console.log(user);

    res.render("profile", { title: "profile", user });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
});
router.get("/profile/edit", async function (req, res, next) {
  try {
    res.render("editprofile", { title: "profile" });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
});

router.post("/kirim-ulasan", async (req, res) => {
  try {
    const { jenis_wisata, ulasan } = req.body;

    // Validasi field `jenis_wisata` dan `ulasan`
    if (!jenis_wisata || !ulasan) {
      return res.status(400).json({ message: "Semua field harus diisi!" });
    }

    let id_data_diri = null;

    // Jika `userId` tersedia, cari data diri terkait
    if (req.session.userId) {
      const dataDiri = await DataDiri.findOne({
        where: { id_user: req.session.userId },
      });
      if (!dataDiri) {
        await DataUlasan.create({
          id_data_diri: null,
          jenisWisataId: jenis_wisata,
          ulasan,
        });
      }
      id_data_diri = dataDiri.id;
    }

    // Simpan ulasan di database
    const data = await DataUlasan.create({
      id_data_diri: id_data_diri,
      jenisWisataId: jenis_wisata,
      ulasan,
    });

    // Panggilan API eksternal jika diperlukan
    // await axios.get("http://localhost:5000/predict");
    console.log("Data saved:", data);
    res.status(201).json({ message: "Ulasan berhasil dikirim", data });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/chat",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

router.get(
  "/admin/dataulasan/analisis",
  isAuthenticated,
  ulasan.analisisUlasan
);
router.get("/admin/dataulasan/analisis", isAuthenticated, ulasan.analisisUlasan);
router.get("/admin/dataulasan", isAuthenticated, ulasan.dataUlasan);
router.get("/admin/dashboard", isAuthenticated, dashboard.store);
router.post("/admin/simpan-point", isAuthenticated, ulasan.simpanPoint);

// JENIS WISATA==========================================================
router.get("/admin/jenis-wisata", isAuthenticated, wisata.daftarWisata);
router.get(
  "/admin/jenis-wisata/add-wisata",
  isAuthenticated,
  async (req, res) => {
    res.render("addwisata", { title: "Tambah Wisata" });
  }
);
router.post(
  "/admin/jenis-wisata/tambah-wisata",
  upload.single("gambar"),
  wisata.simpan
);
router.get("/admin/jenis-wisata/edit-wisata/:id", isAuthenticated);
router.post(
  "/admin/jenis-wisata/edit-wisata/:id",
  upload.single("gambar"),
  wisata.update
);
router.delete("/admin/jenis-wisata/delete-wisata/:id", wisata.hapus);

// PRODUK=======================================================
router.get("/admin/produk", isAuthenticated, produk.listProduk);
router.get("/admin/add-produk", isAuthenticated, produk.tambah);
router.post(
  "/admin/tambah-produk",
  isAuthenticated,
  upload.fields([
    { name: "gambar", maxCount: 1 },
    { name: "sertifikasi_halal", maxCount: 1 },
  ]),
  produk.simpan
);
router.get("/admin/edit-produk/:id", isAuthenticated, produk.edit);
router.post("/admin/edit-produk/:id", upload.single("gambar"), produk.update);
router.delete("/admin/delete-produk/:id", isAuthenticated, produk.hapus);
router.get("/detail-produk/:hashId", isAuthenticated, produk.detail);


//MONITORING
router.get("/admin/monitoring", isAuthenticated, monitoring.view);
router.post('/admin/getdatamonitoring', monitoring.receiveData);


module.exports = router;
