require("dotenv").config();
const { DataUlasan, JenisWisata, User, DataDiri } = require("../../models"); // Adjust the path according to your project structure
const axios = require("axios");

const Anthropic = require("@anthropic-ai/sdk");
const { where } = require("sequelize");
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});
const base_url = process.env.FLASK_BASE_URL;

const analisisUlasan = async (req, res) => {
  try {
    await axios.get(`${base_url}/predict`);
    const predictions = await DataUlasan.findAll();
    const wisata = await JenisWisata.findAll();
   
    const prompt = `
    Data ulasan yang diterima: ${JSON.stringify(predictions)}. 
    Jenis wisata yang tersedia: ${JSON.stringify(wisata)}.
    
    ### Tujuan Analisis
    Melakukan analisis data ulasan untuk:
    1. Mengidentifikasi pola dalam ulasan (positif, netral, negatif).
    2. Menemukan potensi pengembangan wisata berdasarkan data.
    3. Memberikan rekomendasi berbasis bukti dari ulasan.
    
    ### Instruksi Analisis
    1. **Rekap Data Ulasan**
       - Sajikan jumlah ulasan berdasarkan kategori: positif, netral, dan negatif.
    
    2. **Analisis Sentimen dan Masalah Utama**
       - Jelaskan pola utama dari ulasan positif (aspek yang dihargai pengunjung).
       - Temukan masalah yang sering muncul dari ulasan negatif/netral, sertakan bukti berupa kutipan ulasan.
    
    3. **Karakteristik Pengunjung**
       - Identifikasi demografi umum pengunjung dari data (asal daerah, pekerjaan, usia, dll.).
       - Berikan analisis bagaimana karakteristik pengunjung memengaruhi ulasan.
    
    4. **Evaluasi Jenis Wisata**
       Untuk setiap jenis wisata:
       - **Analisis** ulasan yang ada (positif dan negatif).
       - **Bukti**: Kutip ulasan spesifik untuk mendukung penilaian.
       - **Saran**: Rekomendasi pengembangan berdasarkan ulasan tersebut.
    
    5. **Potensi Pengembangan**
       - Analisis peluang pengembangan wisata dari ulasan.
       - Identifikasi potensi wisata baru dengan mengutip ulasan spesifik.
       - Sebutkan dampak yang diharapkan dan langkah yang diperlukan.
    
    6. **Kesimpulan dan Rekomendasi**
       - Buat ringkasan berdasarkan data ulasan, fokus pada rekomendasi prioritas.
       - Langkah konkrit untuk meningkatkan kepuasan pengunjung.
       - Pelatihan atau sumber daya tambahan yang diperlukan.
    
    ### Instruksi Format Output
    1. **Struktur HTML**:
       - Gunakan elemen seperti \`<div>\`, \`<h2>\`, \`<p>\`, dan \`<ul>\` untuk membuat tampilan terstruktur.
       - Beri kelas yg setiap element agar bagus dan menarik untuk ditampilkan, pastikan desain yang terbaik
    
    2. **Penekanan pada Paragraf**:
       - Paragraf diberi class \`text-justify\` agar terlihat rapi.
       - Kutipan ulasan gunakan \`<blockquote class="italic">\` untuk membedakan dari teks lainnya.
    
    3. **Tampilan Responsif**:
       - Gunakan Tailwind utilities untuk memastikan tampilan kompatibel di berbagai perangkat.
       - Sertakan padding (\`p-6\`), background (\`bg-white\`), dan shadow (\`shadow-md\`) untuk estetika.
    
    4. **Panjang Maksimal Jawaban**:
       - Batas panjang 8192 token.
       - Jawab langsung tanpa pengantar, berikan analisis sistematis dan mendalam sesuai instruksi.
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
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log(response.content[0].text);
    const answer = response.content[0].text;

    res.render("analisis", { title: "Analisis Wisata", content: answer });
  } catch (error) {
    // console.error(Error: ${error.message});
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

const dataUlasan = async (req, res) => {
  try {
    // const axios = require("axios");
    await axios.get(`${base_url}/predict`);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Hitung total item tanpa include
    const totalItems = await DataUlasan.count();

    // Ambil data dengan include
    const dataUlasan = await DataUlasan.findAll({
      include: [
        {
          model: JenisWisata,
          as: "jenisWisata", // Gunakan alias di sini
        },
        {
          model: DataDiri,
          as: "DataDiri",
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
    res.status(500).send(error);
  }
};

// Endpoint untuk menyimpan poin
const simpanPoint = async (req, res) => {
  try {
    const { ulasanId, point } = req.body; // Mengambil ulasanId dari body

    // Validasi input
    if (!ulasanId || !point) {
      return res
        .status(400)
        .json({ message: "ID ulasan dan poin harus diisi!" });
    }

    // Update data ulasan dengan poin
    const dataUlasan = await DataUlasan.findOne({ where: { id: ulasanId } });
    if (!dataUlasan) {
      return res.status(404).json({ message: "Ulasan tidak ditemukan" });
    }

    // Simpan poin ke dalam ulasan
    await DataUlasan.update({ point: point }, { where: { id: ulasanId } });

    // Update total poin pengguna
    const dataDiriId = dataUlasan.id_data_diri; // Sesuaikan dengan relasi yang Anda miliki
    const user = await DataDiri.findOne({ where: { id: dataDiriId } });
    const userId = user.id_user;
    const totalPoint = await User.findOne({
      where: { id: userId },
      attributes: ["total_point"],
    });

    if (totalPoint) {
      // Mengonversi total_point ke integer
      const currentTotalPoint = parseInt(totalPoint.total_point, 10) || 0;
      const newTotalPoint = currentTotalPoint + parseInt(point, 10);

      console.log("User ID:", userId);
      console.log("Current Total Point:", currentTotalPoint);
      console.log("Point to Add:", point);
      console.log("New Total Point:", newTotalPoint);

      await User.update(
        { total_point: newTotalPoint }, // Simpan kembali sebagai string jika perlu
        { where: { id: userId } }
      );
    } else {
      console.log("User not found");
    }

    res.redirect("/admin/dataulasan");
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
};

module.exports = {
  analisisUlasan,
  dataUlasan,
  simpanPoint,
};
