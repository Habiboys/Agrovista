const { Pelaporan, DataDiri, User } = require("../../models"); // Adjust the path according to your project structure

const view = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the page number from the query string
    const limit = 5; // Number of items per page
    const offset = (page - 1) * limit; // Calculate the offset

    const totalItems = await Pelaporan.count();

    const pelaporan = await Pelaporan.findAll({
      include: [
        {
          model: DataDiri,
          as: "DataDiri",
        },
      ],
      limit,
      offset,
    });
    const totalPages = Math.ceil(totalItems / limit);
    res.render("datalaporan", {
      title: "Data Laporan",
      pelaporan,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
};

const simpanPoint = async (req, res) => {
  try {
    const { pelaporanId, point } = req.body; // Mengambil pelaporanId dari body

    // Validasi input
    if (!pelaporanId || !point) {
      return res
        .status(400)
        .json({ message: "ID Laporan dan poin harus diisi!" });
    }

    // Update data ulasan dengan poin
    const pelaporan = await Pelaporan.findOne({ where: { id: pelaporanId } });
    if (!pelaporan) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Simpan poin ke dalam ulasan
    await Pelaporan.update({ point: point }, { where: { id: pelaporanId } });

    // Update total poin pengguna
    const dataDiriId = pelaporan.id_data_diri; // Sesuaikan dengan relasi yang Anda miliki
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

    res.redirect("/admin/datalaporan");
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ message: "Terjadi Kesalahan", error });
  }
};

module.exports = {
  view,
  simpanPoint,
};
