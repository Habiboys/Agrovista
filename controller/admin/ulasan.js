require("dotenv").config();
const { DataUlasan, jenis_wisata } = require("../../models"); // Adjust the path according to your project structure
const axios = require("axios");
const Anthropic = require("@anthropic-ai/sdk");
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const analisisUlasan = async (req, res) => {
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
};

const dataUlasan = async (req, res) => {
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
};

module.exports = {
  analisisUlasan,
  dataUlasan,
};
