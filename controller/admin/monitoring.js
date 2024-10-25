exports.view = (req, res) => {
    res.render("monitoring", { title: "Data Monitoring" });
};

exports.receiveData = (req, res) => {
    const io = req.app.get("io");  // Dapatkan instance Socket.IO dari app
    const data = req.body;  // Data dari ESP32

    // Kirim data ke semua client yang terhubung menggunakan WebSocket
    io.emit("sensorData", data);

    res.status(200).send("Data diterima");
};
