const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads 폴더 없으면 생성
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
