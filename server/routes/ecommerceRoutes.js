const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');

router.post('/run', ecommerceController.runTest);
router.get('/report', ecommerceController.getReport);

module.exports = router;
