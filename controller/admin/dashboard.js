require("dotenv").config();
const { sequelize } = require("../../models");
const { DataUlasan, jenis_wisata } = require("../../models"); // Adjust the path according to your project structure
const { where } = require("sequelize");
const { Op } = require("sequelize");
const moment = require("moment");

const store = async (req, res, next) => {
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
};

module.exports = {
  store,
};
