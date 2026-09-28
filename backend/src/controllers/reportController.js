const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { isValidDateString, todayIST } = require('../utils/date');

// GET /api/reports/daily?date=YYYY-MM-DD
async function dailyReport(req, res, next) {
  try {
    const date = req.query.date && isValidDateString(req.query.date) ? req.query.date : todayIST();

    const students = await Student.find({ isActive: true }).sort({ name: 1 });
    const attendanceRecords = await Attendance.find({ date });

    const attendanceMap = new Map(attendanceRecords.map((r) => [r.studentId, r.status]));

    const studentWise = students.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      className: s.className,
      status: attendanceMap.get(s.studentId) || 'Not Marked',
    }));

    const presentCount = studentWise.filter((s) => s.status === 'Present').length;
    const absentCount = studentWise.filter((s) => s.status === 'Absent').length;
    const totalStudents = students.length;
    const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    res.json({
      date,
      totalStudents,
      present: presentCount,
      absent: absentCount,
      notMarked: totalStudents - presentCount - absentCount,
      percentage,
      students: studentWise,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dailyReport };
