var express = require("express");
var router = express.Router();
require("dotenv").config();

const { DataUlasan, jenis_wisata } = require("../models"); // Adjust the path according to your project structure
const { sequelize } = require("../models");
const axios = require("axios");
const MarkdownIt = require("markdown-it");
const Anthropic = require("@anthropic-ai/sdk");
const { where } = require("sequelize");
const { Op } = require("sequelize");
const moment = require("moment");
const anthropic = new Anthropic({
  apiKey:
    "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",
});

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
  const dataUlasan = await DataUlasan.findAll({
    limit: 3,
    order: [["createdAt", "DESC"]],
  });
  res.render("index", {
    title: "AgroWista",
    total_ulasan,
    total_wisata,
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
    const jeniswisata = await jenis_wisata.findAll();
    res.render("jeniswisata", { title: "Jenis Wisata", jeniswisata });
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

module.exports = router;
