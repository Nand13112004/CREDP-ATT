const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const VolunteerAttendance = require('../models/VolunteerAttendance');
const Volunteer = require('../models/Volunteer');
const { isValidDateString, todayIST } = require('../utils/date');

// GET /api/reports/daily?date=YYYY-MM-DD&type=students|volunteers
async function dailyReport(req, res, next) {
  try {
    const date = req.query.date && isValidDateString(req.query.date) ? req.query.date : todayIST();
    const type = req.query.type === 'volunteers' ? 'volunteers' : 'students';

    if (type === 'volunteers') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can view volunteer reports.' });
      }

      const volunteers = await Volunteer.find({ isActive: true }).sort({ name: 1 });
      const attendanceRecords = await VolunteerAttendance.find({ date });

      const attendanceMap = new Map(attendanceRecords.map((r) => [r.volunteerId, r.status]));

      const volunteerWise = volunteers.map((v) => ({
        volunteerId: v.volunteerId,
        name: v.name,
        email: v.email,
        status: attendanceMap.get(v.volunteerId) || 'Not Marked',
      }));

      const presentCount = volunteerWise.filter((v) => v.status === 'Present').length;
      const absentCount = volunteerWise.filter((v) => v.status === 'Absent').length;
      const totalVolunteers = volunteers.length;
      const percentage = totalVolunteers > 0 ? Math.round((presentCount / totalVolunteers) * 100) : 0;

      return res.json({
        date,
        type: 'volunteers',
        totalVolunteers,
        present: presentCount,
        absent: absentCount,
        notMarked: totalVolunteers - presentCount - absentCount,
        percentage,
        volunteers: volunteerWise,
      });
    }

    // Default: students report
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
      type: 'students',
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
