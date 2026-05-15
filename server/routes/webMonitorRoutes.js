const express = require('express');
const router = express.Router();
const webMonitorController = require('../controllers/webMonitorController');

router.post('/start', webMonitorController.startScan);
router.get('/history', webMonitorController.getScans);
router.get('/:id', webMonitorController.getScanDetails);
router.delete('/:id', webMonitorController.deleteJob);

module.exports = router;
