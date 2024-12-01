const ulasan = require("../controller/admin/ulasan");
const dashboard = require("../controller/admin/dashboard");
const produk = require("../controller/admin/produk");
const wisata = require("../controller/admin/wisata");
const monitoring = require("../controller/admin/monitoring");
const laporan = require("../controller/admin/laporan");

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
  Pelaporan,
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
    limit: 3,
    order: [["createdAt", "DESC"]],
  });
  const total_produk = await Produk.count();
  const dataUlasan = await DataUlasan.findAll({
    limit: 3,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: DataDiri,
        as: "DataDiri",
      },
    ],
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

router.get("/pelaporan", async function (req, res, next) {
  try {
    // Fetch all records from the DataUlasan table
    const user = await User.findByPk(req.session.userId, {
      include: [
        {
          model: DataDiri,
        },
      ],
    });

    // Render the 'ulasan' view and pass the data to it if needed
    res.render("pelaporan", {
      title: "Pelaporan",
      user,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
});

router.post("/kirim-laporan", upload.single("gambar"), async (req, res) => {
  try {
    const { judul, deskripsi, nama, jenis_kelamin, umur, asal, pekerjaan } =
      req.body;
    const gambar = req.file ? req.file.filename : null;
    const user = await User.findByPk(req.session.userId);

    if (user) {
      if (!judul || !deskripsi) {
        return res.status(400).json({ message: "Semua field harus diisi!" });
      }

      const dataDiri = await DataDiri.findOne({
        where: { id_user: req.session.userId },
      });
      console.log("DataDiri found:", dataDiri);

      const id_data_diri = dataDiri.id;
      const data = await Pelaporan.create({
        id_data_diri: id_data_diri,
        judul: judul,
        deskripsi: deskripsi,
        gambar: gambar,
        point: 0,
      });

      console.log("Data saved:", data);
    } else {
      // Validasi field `jenis_wisata` dan `ulasan`
      if (
        !judul ||
        !deskripsi ||
        !gambar ||
        !jenis_kelamin ||
        !umur ||
        !asal ||
        !pekerjaan
      ) {
        return res
          .status(400)
          .json({ message: "Semua field harus diisi kecuali nama!" });
      }

      const identitas = await DataDiri.create({
        nama: nama || "Guest",
        umur: umur,
        jenis_kelamin: jenis_kelamin,
        pekerjaan: pekerjaan,
        asal: asal,
      });
      console.log("Identitas created:", identitas);

      const data = await Pelaporan.create({
        id_data_diri: identitas.id,
        judul: judul,
        deskripsi: deskripsi,
        gambar: gambar,
        point: 0,
      });

      console.log("Data saved:", data);
    }

    res.redirect("/pelaporan");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
});

async function updateTotalPoints() {
  // Ambil semua pengguna
  const users = await User.findAll();

  for (let user of users) {
    // Ambil semua DataDiri terkait user
    const dataDiris = await DataDiri.findAll({
      where: { id_user: user.id },
    });

    // Dapatkan ID DataDiri
    const dataDiriIds = dataDiris.map((dataDiri) => dataDiri.id);

    // Hitung total poin dari DataUlasan yang terkait dengan DataDiri
    const totalPoints = await DataUlasan.sum("point", {
      where: { id_data_diri: dataDiriIds },
    });

    // Update total_point untuk user
    console.log(
      `Updating total points for user ${user.id} to ${totalPoints || 0}`
    );
    await user.update({ total_point: totalPoints || 0 });
  }
}

router.get("/profile", async function (req, res, next) {
  try {
    await updateTotalPoints();
    const user = await User.findByPk(req.session.userId, {
      include: [
        {
          model: DataDiri,
          as: "DataDiri",
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

// router.get("/profile/edit", async function (req, res, next) {
//   try {
//     res.render("editprofile", { title: "profile" });
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     next(error);
//   }
// });

router.post("/kirim-ulasan", async (req, res) => {
  try {
    const { jenis_wisata, ulasan, nama, jenis_kelamin, umur, asal, pekerjaan } =
      req.body;
    const user = await User.findByPk(req.session.userId);

    if (user) {
      if (!jenis_wisata || !ulasan) {
        return res.status(400).json({ message: "Semua field harus diisi!" });
      }

      const dataDiri = await DataDiri.findOne({
        where: { id_user: req.session.userId },
      });
      console.log("DataDiri found:", dataDiri);

      const id_data_diri = dataDiri.id;
      const data = await DataUlasan.create({
        id_data_diri: id_data_diri,
        jenisWisataId: jenis_wisata,
        ulasan,
        point: 0,
      });

      console.log("Data saved:", data);
    } else {
      // Validasi field `jenis_wisata` dan `ulasan`
      if (
        !jenis_wisata ||
        !ulasan ||
        !jenis_kelamin ||
        !umur ||
        !asal ||
        !pekerjaan
      ) {
        return res
          .status(400)
          .json({ message: "Semua field harus diisi kecuali nama!" });
      }

      const identitas = await DataDiri.create({
        nama: nama || "Guest",
        umur: umur,
        jenis_kelamin: jenis_kelamin,
        pekerjaan: pekerjaan,
        asal: asal,
      });
      console.log("Identitas created:", identitas);

      const data = await DataUlasan.create({
        id_data_diri: identitas.id,
        jenisWisataId: jenis_wisata,
        ulasan: ulasan,
        point: 0,
      });

      console.log("Data saved:", data);
    }

    // console.log("Data saved:", data);
    res.redirect("/ulasan");
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
    res.status(500).json({
      error: "An error occurred while processing your request.",
    });
  }
});

router.get(
  "/admin/dataulasan/analisis",
  isAuthenticated,
  ulasan.analisisUlasan
);
router.get(
  "/admin/dataulasan/analisis",
  isAuthenticated,
  ulasan.analisisUlasan
);
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
router.get("/admin/jenis-wisata/edit-wisata/:id", isAuthenticated, wisata.edit);
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
router.get("/detail-produk/:hashId", produk.detail);

//MONITORING
router.get("/admin/monitoring", isAuthenticated, monitoring.view);
router.post("/admin/getdatamonitoring", monitoring.receiveData);

router.get("/admin/datalaporan", isAuthenticated, laporan.view);
router.post(
  "/admin/simpan-point-laporan",
  isAuthenticated,
  laporan.simpanPoint
);

module.exports = router;
