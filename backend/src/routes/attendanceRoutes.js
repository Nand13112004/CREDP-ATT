const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  updateAttendance,
  getStudentAttendance,
  markVolunteerAttendance,
  getVolunteerAttendanceByDate,
  getVolunteerAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Student attendance routes
router.post('/', markAttendance);
router.get('/', getAttendanceByDate);
router.put('/:id', updateAttendance);
router.get('/student/:studentId', getStudentAttendance);

// Volunteer attendance routes (Admin only)
router.post('/volunteers', authorize('admin'), markVolunteerAttendance);
router.get('/volunteers', authorize('admin'), getVolunteerAttendanceByDate);
router.get('/volunteer/:volunteerId', (req, res, next) => {
  // Admin can view any volunteer; volunteer can view their own
  if (req.user.role === 'admin' || req.user.volunteerId === req.params.volunteerId.trim().toUpperCase()) {
    return getVolunteerAttendance(req, res, next);
  }
  return res.status(403).json({ message: 'You do not have permission to perform this action.' });
});

module.exports = router;

