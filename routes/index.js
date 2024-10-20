var express = require("express");
var router = express.Router();
require("dotenv").config();

const { DataUlasan, jenis_wisata, Produk } = require("../models"); // Adjust the path according to your project structure
const { sequelize } = require("../models");
const axios = require("axios");
const MarkdownIt = require("markdown-it");
const Anthropic = require("@anthropic-ai/sdk");
const { where } = require("sequelize");
const { Op } = require("sequelize");
const moment = require("moment");
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});
const QRCode = require("qrcode");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const upload = require("../middleware/uploadFile");

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect("/auth/login");
  }
}

router.get("/", async (req, res) => {
  const total_ulasan = await DataUlasan.count();
  const total_wisata = await jenis_wisata.count();
  const jenisWisata = await jenis_wisata.findAll({
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
  });
});

// Route to display 'Ulasan' page and log data from 'data_ulasan' table
router.get("/ulasan", async function (req, res, next) {
  try {
    // Fetch all records from the DataUlasan table
    const ulasanData = await DataUlasan.findAll();
    const jenisWisata = await jenis_wisata.findAll();

    // Log the results to the console
    console.log(ulasanData);

    // Render the 'ulasan' view and pass the data to it if needed
    res.render("ulasan", { title: "Ulasan", data: ulasanData, jenisWisata });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
});

function convertToHTML(text) {
  let formattedText = text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold'>$1</strong>")
    .replace(
      /##\s(.*?)(?:<br>|$)/g,
      "<h2 class='text-2xl font-bold mt-6 mb-4 text-green-700'>$1</h2>"
    )
    .replace(
      /1\.\s(.*?)(?:<br>|$)/g,
      "<h3 class='text-xl font-semibold mt-4 mb-2 text-green-600'>1. $1</h3>"
    )
    .replace(
      /2\.\s(.*?)(?:<br>|$)/g,
      "<h3 class='text-xl font-semibold mt-4 mb-2 text-green-600'>2. $1</h3>"
    )
    .replace(
      /3\.\s(.*?)(?:<br>|$)/g,
      "<h3 class='text-xl font-semibold mt-4 mb-2 text-green-600'>3. $1</h3>"
    )
    .replace(/\*\s(.*?)(?:<br>|$)/g, "<li class='ml-6 list-disc'>$1</li>")
    .replace(/a\.\s(.*?)(?:<br>|$)/g, "<p class='font-semibold mt-2'>a. $1</p>")
    .replace(
      /b\.\s(.*?)(?:<br>|$)/g,
      "<p class='font-semibold mt-2'>b. $1</p>"
    );

  return formattedText;
}
// Define the /predict route
router.get("/predict", async (req, res) => {
  try {
    // Send a request to the Flask API
    const response = await axios.get("http://localhost:5000/predict");

    // Get the predictions from the Flask response
    const predictions = response.data;

    // Send the predictions back as the response
    res.json(predictions);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/admin/dataulasan/analisis", isAuthenticated, async (req, res) => {
  try {
    await axios.get("http://localhost:5000/predict");
    const predictions = await DataUlasan.findAll();
    const wisata = await jenis_wisata.findAll();
    const promptalt =
      "siapa presiden mesir pertama?, jawaban yg dikirimkan dalam datg html karna saya ingin menampilkannya dihalaman web usahakan pakai class css tailwind, Langsung saja berikan jawabban tanpa pengantar";
    const prompt = `
Data ulasan yang diterima: ${JSON.stringify(
      predictions
    )}. dan ini jenis wisatanya  ${JSON.stringify(wisata)}
  Analisis Potensi Desa Leuwimalang dalam Pengembangan Wisata

Berdasarkan data ulasan dan jenis kegiatan wisata yang ada, analisis mendalam ini bertujuan untuk memetakan potensi desa Leuwimalang serta menyelesaikan berbagai permasalahan yang ada.

A. Rekap Data yang Diterima

1. Data Ulasan
   - Jabarkan jumlah ulasan positif, netral, dan negatif.
   
2. Karakteristik Pengunjung
   - Dari pengunjung yang memberikan ulasan, simpulkan karakteristik umum mereka, termasuk aspek pekerjaan, asal, jenis kelamin, dan faktor demografis lainnya.

B. Penilaian Masing-masing Kegiatan Wisata

Untuk setiap kegiatan wisata, jabarkan hal-hal berikut:

1. Pendahuluan
   - Deskripsi singkat mengenai kegiatan wisata.

2. Respon Positif
   - Apa yang mendapatkan tanggapan positif dari pengunjung?

3. Respon Negatif/Pemasalahan
   - Identifikasi masalah yang dihadapi berdasarkan ulasan.

4. Rumusan
   - Apa yang perlu ditingkatkan dan diperbaiki, serta solusi yang diusulkan.

5. Saran Pengembangan
   - Berdasarkan ulasan sebelumnya, sampaikan saran untuk pengembangan kegiatan wisata tersebut.

C. Potensi Pengembangan Kegiatan Wisata yang Sudah Ada
Dari kegiatan wisata yg sudah ada apa yg bisa dikembangkan lagi jelaskan masing masing dengan poin-poin ini

1. Alasan Pengembangan
   - Identifikasi bagian dari ulasan yang menunjukkan potensi untuk dikembangkan.

2. Dampak yang Diharapkan
   - Apa dampak positif yang diharapkan dari pengembangan tersebut?

3. Upaya untuk Mengembangkan
   - Rencana aksi untuk mengembangkan potensi yang ada.

4. Tantangan
   - Apa saja tantangan yang mungkin dihadapi dalam pengembangan ini?

D. Potensi Pengembangan yang Belum Ada 
Kegiatan/Program apa yg bisa jadi potensi jelaskan masing faktor berikut:
1. Alasan
   - Identifikasi potensi baru berdasarkan ulasan pengunjung yang ada.

2. Dampak yang Diharapkan
   - Apa dampak yang diharapkan jika potensi ini dikembangkan?

3. Kebutuhan
   - Apa saja yang dibutuhkan untuk mewujudkannya?

4. Upaya
   - Rencana tindakan untuk mengimplementasikan potensi baru tersebut.

5. Tantangan
   - Apa saja tantangan yang mungkin dihadapi dalam pengembangan potensi baru ini?

E. Saran dan Kesimpulan

Sampaikan saran untuk pengelolaan desa wisata ini saat ini dan ke depan, berdasarkan potensi yang telah dipetakan sebelumnya. Diskusikan juga pelatihan yang diperlukan bagi sumber daya manusia (SDM) yang akan mengelola pengembangan ini.
jawab rangkaian pertanyaan diatas dengan analisis yang mendalam , detail , fakta, sistematis dan penuh pertimbangan, berikan jawaban yang Panjang maksimal  8192 token, jawaban yg dikirimkan dalam datg html karna saya ingin menampilkannya dihalaman web usahakan pakai class css tailwind.kalau ada paragraf beri justify. Langsung saja berikan jawabban tanpa pengantar
`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptalt,
            },
          ],
        },
      ],
    });

    console.log(response.content[0].text);
    const answer = response.content[0].text;

    res.render("analisis", { title: "Analisis Wisata", content: answer });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

router.get("/admin/dashboard", isAuthenticated, async (req, res, next) => {
  try {
    const monthlyData = {
      positif: [],
      netral: [],
      negatif: [],
    };

    // Loop through each month of the year
    for (let month = 0; month < 12; month++) {
      const startOfMonth = moment().month(month).startOf("month").toDate();
      const endOfMonth = moment().month(month).endOf("month").toDate();

      // Count total reviews for the current month
      const total_positif = await DataUlasan.count({
        where: {
          label: "Positif",
          createdAt: {
            [Op.gte]: startOfMonth, // Start of the month
            [Op.lt]: endOfMonth, // End of the month
          },
        },
      });

      // Count negative reviews for the current month
      const total_negatif = await DataUlasan.count({
        where: {
          label: "Negatif",
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lt]: endOfMonth,
          },
        },
      });

      // Count neutral reviews for the current month
      const total_netral = await DataUlasan.count({
        where: {
          label: "Netral",
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lt]: endOfMonth,
          },
        },
      });

      // Push monthly counts into the monthlyData object
      monthlyData.positif.push(total_positif);
      monthlyData.netral.push(total_netral);
      monthlyData.negatif.push(total_negatif);
    }

    // Count total reviews and total types of tourism
    const total_ulasan = await DataUlasan.count();
    const total_wisata = await jenis_wisata.count();

    const reviewCounts = await DataUlasan.findAll({
      attributes: [
        "jenisWisataId", // Use the foreign key to get the tourism type
        [sequelize.fn("COUNT", sequelize.col("DataUlasan.id")), "count"], // Count of reviews
      ],
      group: "jenisWisataId",
      include: [
        {
          model: jenis_wisata, // Use the imported model directly
          attributes: ["id", "nama_wisata"], // Specify which attributes to include from jenis_wisata
          as: "jenisWisata", // Use the alias defined in the association
        },
      ],
    });

    // Create labels and data arrays
    const labels = reviewCounts.map((review) => review.jenisWisata.nama_wisata);
    const data = reviewCounts.map((review) => review.dataValues.count);

    const tourismTypes = await jenis_wisata.findAll({
      attributes: ["id", "nama_wisata"], // Fetch the ID and name of tourism types
    });

    // Create an array to hold the labels and initialize chart data
    const label = tourismTypes.map((type) => type.nama_wisata); // Extract names for labels
    const chartData = {
      labels: labels,
      positif: Array(label.length).fill(0),
      negatif: Array(label.length).fill(0),
      netral: Array(label.length).fill(0),
    };

    const sentiments = ["Positif", "Negatif", "Netral"];
    for (const sentiment of sentiments) {
      const reviewCounts = await DataUlasan.findAll({
        attributes: [
          "jenisWisataId", // Use the foreign key to get the tourism type
          [sequelize.fn("COUNT", sequelize.col("DataUlasan.id")), "count"], // Count of reviews
        ],
        where: {
          label: sentiment, // Filter by label
        },
        group: "jenisWisataId",
        include: [
          {
            model: jenis_wisata,
            attributes: ["id", "nama_wisata"],
            as: "jenisWisata",
          },
        ],
      });

      reviewCounts.forEach((review) => {
        const index = label.indexOf(review.jenisWisata.nama_wisata); // Find index by name
        if (index !== -1) {
          // Ensure it exists
          if (sentiment === "Positif") {
            chartData.positif[index] = review.dataValues.count;
          } else if (sentiment === "Negatif") {
            chartData.negatif[index] = review.dataValues.count;
          } else if (sentiment === "Netral") {
            chartData.netral[index] = review.dataValues.count;
          }
        }
      });
    }

    const umurRanges = [
      { label: "<20", min: 0, max: 20 },
      { label: "21-30", min: 21, max: 30 },
      { label: "31-40", min: 31, max: 40 },
      { label: "41-50", min: 41, max: 50 },
      { label: "51-60", min: 51, max: 60 },
      { label: ">60", min: 61, max: 100 },
    ];

    // Fetch counts for each age group
    const umurCounts = await Promise.all(
      umurRanges.map(async (range) => {
        return await DataUlasan.count({
          where: {
            umur: {
              [Op.and]: [{ [Op.gte]: range.min }, { [Op.lte]: range.max }],
            },
          },
        });
      })
    );

    const asalCounts = await DataUlasan.findAll({
      attributes: [
        "asal",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: "asal",
    });

    // Prepare the data for the chart
    const asalLabels = asalCounts.map((row) => row.asal); // Extract asal names
    const asalData = asalCounts.map((row) => row.dataValues.count); // Extract counts

    // Render the dashboard with the collected data
    res.render("dashboard", {
      title: "Dashboard",
      total_ulasan,
      total_wisata,
      total_positif: monthlyData.positif.reduce((a, b) => a + b, 0), // Total positive across all months
      total_negatif: monthlyData.negatif.reduce((a, b) => a + b, 0), // Total negative across all months
      total_netral: monthlyData.netral.reduce((a, b) => a + b, 0), // Total neutral across all months
      monthlyData: JSON.stringify(monthlyData),
      reviewCounts: JSON.stringify({ labels, data }),
      chartData: JSON.stringify(chartData),
      umurCounts: JSON.stringify(umurCounts), // Convert umurCounts to JSON
      umurLabels: JSON.stringify(umurRanges.map((range) => range.label)),
      asalLabels: JSON.stringify(asalLabels), // Pass asal labels to the template
      asalData: JSON.stringify(asalData),
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error); // Pass the error to the next middleware for handling
  }
});

router.get("/admin/jeniswisata", isAuthenticated, async (req, res) => {
  try {
    // const jeniswisata = await jenis_wisata.findAll();
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1; // Get the page number from the query string
    const limit = 5; // Number of items per page
    const offset = (page - 1) * limit; // Calculate the offset

    const { rows: jeniswisata, count: totalItems } =
      await jenis_wisata.findAndCountAll({
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
});

router.get("/admin/dataulasan", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the page number from the query string
    const limit = 10; // Number of items per page
    const offset = (page - 1) * limit; // Calculate the offset

    const { rows: dataUlasan, count: totalItems } =
      await DataUlasan.findAndCountAll({
        include: [
          {
            model: jenis_wisata, // Use the actual model reference here
            as: "jenisWisata", // This should match the alias defined in your model association
            attributes: ["nama_wisata"], // Specify the attributes you want to include
          },
        ],
        limit,
        offset,
      });

    const totalPages = Math.ceil(totalItems / limit);

    res.render("dataulasan", {
      title: "Data Ulasan",
      dataUlasan,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

router.post("/kirim-ulasan", async (req, res) => {
  try {
    const { nama, jenis_kelamin, umur, asal, pekerjaan, jenis_wisata, ulasan } =
      req.body;

    // Log the received body for debugging
    console.log("Received body:", req.body);

    // Validate the received data (optional)
    if (
      !jenis_kelamin ||
      !umur ||
      !asal ||
      !pekerjaan ||
      !jenis_wisata ||
      !ulasan
    ) {
      return res.status(400).json({ message: "Semua field harus diisi!" });
    }

    // Create the data in the database
    const data = await DataUlasan.create({
      nama,
      jenis_kelamin,
      umur,
      asal,
      pekerjaan,
      jenisWisataId: jenis_wisata,
      ulasan,
    });

    await axios.get("http://localhost:5000/predict");
    console.log("Data saved:", data);
    res.status(201).json({ message: "Ulasan berhasil dikirim", data });
  } catch (error) {
    console.error("Error: ", error.message);
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

router.get("/admin/add-wisata", isAuthenticated, async (req, res) => {
  res.render("addwisata", { title: "Tambah Wisata" });
});

router.post("/tambah-wisata", upload.single("gambar"), async (req, res) => {
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
    const wisata = await jenis_wisata.create({
      nama_wisata,
      deskripsi,
      gambar: gambar, // Simpan path gambar yang diunggah
    });

    res.status(201).json({ message: "Wisata berhasil ditambahkan", wisata });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
});

router.get("/admin/edit-wisata/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const wisata = await jenis_wisata.findByPk(id);

    if (!wisata) {
      return res.status(404).json({ message: "Wisata tidak ditemukan" });
    }

    res.render("editwisata", { title: "Edit Wisata", wisata });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
});

router.post(
  "/admin/edit-wisata/:id",
  upload.single("gambar"),
  async (req, res) => {
    try {
      const id = req.params.id;
      const { nama_wisata, deskripsi } = req.body;

      // Memeriksa apakah file gambar diunggah
      const gambar = req.file ? req.file.filename : null; // Mendapatkan path gambar dari multer jika ada

      // Mendapatkan data wisata yang ada di database
      const existingWisata = await jenis_wisata.findByPk(id);

      if (!existingWisata) {
        return res.status(404).json({ message: "Wisata tidak ditemukan" });
      }

      // Update data wisata di database
      const updatedData = {
        nama_wisata: nama_wisata || existingWisata.nama_wisata, // Jika nama_wisata tidak diisi, gunakan data yang sudah ada
        deskripsi: deskripsi || existingWisata.deskripsi, // Jika deskripsi tidak diisi, gunakan data yang sudah ada
        gambar: gambar || existingWisata.gambar, // Jika gambar tidak diunggah, gunakan gambar yang sudah ada
      };

      await jenis_wisata.update(updatedData, {
        where: { id },
      });

      res.status(200).json({ message: "Wisata berhasil diperbarui" });
    } catch (error) {
      console.error("Error: ", error.message);
      res.status(500).json({ message: "Terjadi kesalahan", error });
    }
  }
);

router.delete("/delete-wisata/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Hapus data wisata dari database berdasarkan ID
    const wisata = await jenis_wisata.findByPk(id);
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
});

router.get("/admin/produk", isAuthenticated, async (req, res) => {
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
});

router.get("/admin/add-produk", isAuthenticated, async (req, res) => {
  const kategoriEnum = Produk.rawAttributes.kategori.values;
  res.render("addproduk", { title: "Tambah Produk", kategoriEnum });
});

const qrcodeDir = path.join(__dirname, "..", "qrcodes");
if (!fs.existsSync(qrcodeDir)) {
  fs.mkdirSync(qrcodeDir, { recursive: true });
}

router.post(
  "/tambah-produk",
  upload.fields([
    { name: "gambar", maxCount: 1 },
    { name: "sertifikasi_halal", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { nama, kategori, komposisi, deskripsi, status_halal } = req.body;

      // Memastikan bahwa file gambar telah diunggah (gambar wajib)
      if (!req.files || !req.files.gambar) {
        return res
          .status(400)
          .json({ message: "Gambar produk harus diunggah!" });
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
  }
);

router.get("/admin/edit-produk/:id", isAuthenticated, async (req, res) => {
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
});

router.post(
  "/admin/edit-produk/:id",
  upload.single("gambar"),
  async (req, res) => {
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
  }
);

router.delete("/delete-produk/:id", async (req, res) => {
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
});

router.get("/detail-produk/:hashId", async (req, res) => {
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
});

module.exports = router;
