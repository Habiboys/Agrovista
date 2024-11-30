const { Pelaporan } = require("../../models"); // Adjust the path according to your project structure

const view = async (req, res) => {
    try {
        const userId = req.session.userId;
        const page = parseInt(req.query.page) || 1; // Get the page number from the query string
        const limit = 5; // Number of items per page
        const offset = (page - 1) * limit; // Calculate the offset

        const { rows: pelaporan, count: totalItems } =
            await Pelaporan.findAndCountAll({
                limit,
                offset,
            });
        const totalPages = Math.ceil(totalItems / limit);
        res.render("datalaporan", {
            title: "Data Laporan",
            pelaporan,
            userId,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        next(error);
    }
};

module.exports = {
    view,
};
