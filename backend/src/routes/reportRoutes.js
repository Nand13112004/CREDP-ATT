const express = require('express');
const { dailyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/daily', dailyReport);

module.exports = router;
