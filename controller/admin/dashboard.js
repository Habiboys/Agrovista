require("dotenv").config();
const { sequelize } = require("../../models");
const { DataUlasan, JenisWisata, DataDiri } = require("../../models");
const { Op } = require("sequelize");
const moment = require("moment");

const store = async (req, res, next) => {
  try {
    const monthlyData = {
      positif: [],
      netral: [],
      negatif: [],
    };

    for (let month = 0; month < 12; month++) {
      const startOfMonth = moment().month(month).startOf("month").toDate();
      const endOfMonth = moment().month(month).endOf("month").toDate();

      const total_positif = await DataUlasan.count({
        where: {
          label: "Positif",
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lt]: endOfMonth,
          },
        },
      });

      const total_negatif = await DataUlasan.count({
        where: {
          label: "Negatif",
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lt]: endOfMonth,
          },
        },
      });

      const total_netral = await DataUlasan.count({
        where: {
          label: "Netral",
          createdAt: {
            [Op.gte]: startOfMonth,
            [Op.lt]: endOfMonth,
          },
        },
      });

      monthlyData.positif.push(total_positif);
      monthlyData.netral.push(total_netral);
      monthlyData.negatif.push(total_negatif);
    }

    const total_ulasan = await DataUlasan.count();
    const total_wisata = await JenisWisata.count();

    const reviewCounts = await DataUlasan.findAll({
      attributes: [
        "jenisWisataId",
        [sequelize.fn("COUNT", sequelize.col("DataUlasan.id")), "count"], // Ganti "DataUlasan.id" sesuai dengan alias yang benar
      ],
      group: "jenisWisataId",
      include: [
        {
          model: JenisWisata,
          attributes: ["id", "nama_wisata"],
          as: "jenisWisata",
        },
      ],
    });

    const labels = reviewCounts
      .map((review) =>
        review.jenisWisata ? review.jenisWisata.nama_wisata : null
      )
      .filter(Boolean);
    const data = reviewCounts.map((review) => review.dataValues.count);

    const tourismTypes = await JenisWisata.findAll({
      attributes: ["id", "nama_wisata"],
    });

    const label = tourismTypes.map((type) => type.nama_wisata);
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
          "jenisWisataId",
          [sequelize.fn("COUNT", sequelize.col("DataUlasan.id")), "count"], // Ganti "DataUlasan.id" sesuai dengan alias yang benar
        ],
        where: {
          label: sentiment,
        },
        group: "jenisWisataId",
        include: [
          {
            model: JenisWisata,
            attributes: ["id", "nama_wisata"],
            as: "jenisWisata",
          },
        ],
      });

      reviewCounts.forEach((review) => {
        const index = label.indexOf(
          review.JenisWisata ? review.jenisWisata.nama_wisata : null
        );
        if (index !== -1) {
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

    const umurCounts = await Promise.all(
      umurRanges.map(async (range) => {
        return await DataUlasan.count({
          include: [
            {
              model: DataDiri,
              attributes: [],
              required: true,
              as: "DataDiri",
            },
          ],
          where: {
            "$DataDiri.umur$": {
              [Op.and]: [{ [Op.gte]: range.min }, { [Op.lte]: range.max }],
            },
          },
        });
      })
    );

    const asalCounts = await DataUlasan.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("DataDiri.id")), "count"], // Menghitung jumlah dari DataDiri
      ],
      include: [
        {
          model: DataDiri,
          attributes: ["asal"], // Mengambil kolom asal dari DataDiri
          required: true,
          as: "DataDiri",
        },
      ],
      group: ["DataDiri.asal"], // Mengelompokkan berdasarkan asal dari DataDiri
    });

    const asalLabels = asalCounts.map((row) => row.asal);
    const asalData = asalCounts.map((row) => row.dataValues.count);

    res.render("dashboard", {
      title: "Dashboard",
      total_ulasan,
      total_wisata,
      total_positif: monthlyData.positif.reduce((a, b) => a + b, 0),
      total_negatif: monthlyData.negatif.reduce((a, b) => a + b, 0),
      total_netral: monthlyData.netral.reduce((a, b) => a + b, 0),
      monthlyData: JSON.stringify(monthlyData),
      reviewCounts: JSON.stringify({ labels, data }),
      chartData: JSON.stringify(chartData),
      umurCounts: JSON.stringify(umurCounts),
      asalLabels: JSON.stringify(asalLabels),
      asalData: JSON.stringify(asalData),
      umurCounts: JSON.stringify(umurCounts), // Convert umurCounts to JSON
      umurLabels: JSON.stringify(umurRanges.map((range) => range.label)),
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
};

module.exports = {
  store,
};
