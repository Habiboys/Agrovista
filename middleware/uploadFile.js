const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Check if userId is present in session
        const dir = path.join(__dirname, "..", "uploads");
        // Default to "guest" if no userId

        // Create the directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir); // Pass the directory path to multer
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `file-${timestamp}${ext}`;
        cb(null, filename); // Generate unique file name
    },
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/; // Allow these file types
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
        cb(null, true); // Accept file
    } else {
        cb(new Error("Error: Invalid file type!")); // Reject file
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
    fileFilter: fileFilter,
});

module.exports = upload;
