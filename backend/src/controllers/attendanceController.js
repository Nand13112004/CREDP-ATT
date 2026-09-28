const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { isValidDateString, todayIST } = require('../utils/date');

// POST /api/attendance
// Body: { date, records: [{ studentId, status }] }
// Upserts (creates or updates) attendance per student for the given date.
async function markAttendance(req, res, next) {
  try {
    const { date, records } = req.body;
    const attendanceDate = date && isValidDateString(date) ? date : todayIST();

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records must be a non-empty array of { studentId, status }.' });
    }

    const markedBy = req.user.role === 'admin' ? 'ADMIN' : req.user.volunteerId;
    const markedByRole = req.user.role;

    const results = [];
    for (const rec of records) {
      if (!rec.studentId || !['Present', 'Absent'].includes(rec.status)) continue;

      const studentId = rec.studentId.trim().toUpperCase();
      const doc = await Attendance.findOneAndUpdate(
        { studentId, date: attendanceDate },
        { studentId, date: attendanceDate, status: rec.status, markedBy, markedByRole },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(doc);
    }

    res.status(200).json({ message: 'Attendance saved successfully.', date: attendanceDate, records: results });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance?date=YYYY-MM-DD
async function getAttendanceByDate(req, res, next) {
  try {
    const date = req.query.date && isValidDateString(req.query.date) ? req.query.date : todayIST();
    const records = await Attendance.find({ date });
    res.json({ date, records });
  } catch (err) {
    next(err);
  }
}

// PUT /api/attendance/:id
async function updateAttendance(req, res, next) {
  try {
    const { status } = req.body;
    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ message: 'status must be Present or Absent.' });
    }

    const markedBy = req.user.role === 'admin' ? 'ADMIN' : req.user.volunteerId;
    const markedByRole = req.user.role;

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, markedBy, markedByRole },
      { new: true, runValidators: true }
    );

    if (!record) return res.status(404).json({ message: 'Attendance record not found.' });
    res.json(record);
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/student/:studentId
async function getStudentAttendance(req, res, next) {
  try {
    const studentId = req.params.studentId.trim().toUpperCase();
    const student = await Student.findOne({ studentId });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const records = await Attendance.find({ studentId }).sort({ date: -1 });
    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'Present').length;
    const absentDays = totalDays - presentDays;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      student: { studentId: student.studentId, name: student.name, className: student.className },
      totalDays,
      presentDays,
      absentDays,
      percentage,
      history: records.map((r) => ({ date: r.date, status: r.status })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { markAttendance, getAttendanceByDate, updateAttendance, getStudentAttendance };
