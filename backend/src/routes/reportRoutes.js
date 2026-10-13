const express = require('express');
const { dailyReport, exportAttendance } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/daily', dailyReport);
router.get('/export', authorize('admin'), exportAttendance);

module.exports = router;
