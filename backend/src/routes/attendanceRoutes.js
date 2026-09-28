const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  updateAttendance,
  getStudentAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', markAttendance);
router.get('/', getAttendanceByDate);
router.put('/:id', updateAttendance);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
