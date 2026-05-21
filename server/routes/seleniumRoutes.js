const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const seleniumController = require('../controllers/seleniumController');

const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for script uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'selenium_script_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/dashboard', seleniumController.getDashboardData);
router.post('/upload', upload.single('script'), seleniumController.uploadScript);
router.get('/scripts', seleniumController.getScripts);
router.post('/run', seleniumController.runTest);
router.get('/job/:id', seleniumController.getJobDetails);
router.delete('/job/:id', seleniumController.deleteJob);

module.exports = router;
