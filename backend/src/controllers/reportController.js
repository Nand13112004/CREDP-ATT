const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const VolunteerAttendance = require('../models/VolunteerAttendance');
const Volunteer = require('../models/Volunteer');
const ExcelJS = require('exceljs');
const { isValidDateString, todayIST } = require('../utils/date');

// GET /api/reports/daily?date=YYYY-MM-DD&type=students|volunteers
async function dailyReport(req, res, next) {
  try {
    const rawDate = req.query.date;

    if (rawDate !== undefined && !isValidDateString(rawDate)) {
      return res.status(400).json({ message: 'date must be a valid YYYY-MM-DD value.' });
    }

    const date = rawDate && isValidDateString(rawDate) ? rawDate : todayIST();
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

const workbookColors = {
  navy: 'FF1F3A5F',
  blue: 'FF2563EB',
  paleBlue: 'FFEFF6FF',
  border: 'FFD1D9E6',
  text: 'FF1F2937',
  muted: 'FF64748B',
  green: 'FFDCFCE7',
  red: 'FFFEE2E2',
  amber: 'FFFEF3C7',
  white: 'FFFFFFFF',
};
const MAX_EXCEL_DATA_ROWS = 1048572;

function styleTable(worksheet, headerRow, firstDataRow, lastDataRow, widths) {
  const header = worksheet.getRow(headerRow);
  header.height = 26;
  header.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: workbookColors.navy } };
    cell.font = { bold: true, color: { argb: workbookColors.white }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: workbookColors.border } },
      left: { style: 'thin', color: { argb: workbookColors.border } },
      bottom: { style: 'thin', color: { argb: workbookColors.border } },
      right: { style: 'thin', color: { argb: workbookColors.border } },
    };
  });

  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  for (let rowNumber = firstDataRow; rowNumber <= lastDataRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.height = 22;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { color: { argb: workbookColors.text }, size: 10 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: workbookColors.border } },
        left: { style: 'thin', color: { argb: workbookColors.border } },
        bottom: { style: 'thin', color: { argb: workbookColors.border } },
        right: { style: 'thin', color: { argb: workbookColors.border } },
      };
      if (rowNumber % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: workbookColors.paleBlue } };
      }
    });
  }
}

function addWorkbookTitle(worksheet, columnCount, title, subtitle) {
  worksheet.mergeCells(1, 1, 1, columnCount);
  worksheet.mergeCells(2, 1, 2, columnCount);
  worksheet.getCell(1, 1).value = title;
  worksheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: workbookColors.white } };
  worksheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: workbookColors.navy } };
  worksheet.getCell(1, 1).alignment = { vertical: 'middle' };
  worksheet.getRow(1).height = 32;
  worksheet.getCell(2, 1).value = subtitle;
  worksheet.getCell(2, 1).font = { size: 10, color: { argb: workbookColors.muted }, italic: true };
  worksheet.getRow(2).height = 22;
}

function getDateRange(fromDate, toDate) {
  const dates = [];
  const current = new Date(`${fromDate}T00:00:00.000Z`);
  const last = new Date(`${toDate}T00:00:00.000Z`);

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function addAttendanceSheet(workbook, { name, title, subtitle, headers, rows, widths, statusColumn }) {
  const worksheet = workbook.addWorksheet(name, {
    properties: { tabColor: { argb: workbookColors.blue } },
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  addWorkbookTitle(worksheet, headers.length, title, subtitle);
  worksheet.addRow([]);
  worksheet.addRow(headers);

  rows.forEach((values) => worksheet.addRow(values));
  if (rows.length === 0) {
    const emptyRow = worksheet.addRow(['No attendance records for this date range.']);
    worksheet.mergeCells(emptyRow.number, 1, emptyRow.number, headers.length);
  }

  const lastDataRow = worksheet.rowCount;
  styleTable(worksheet, 4, 5, lastDataRow, widths);
  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: lastDataRow, column: headers.length },
  };

  if (statusColumn && rows.length > 0) {
    for (let rowNumber = 5; rowNumber <= lastDataRow; rowNumber += 1) {
      const cell = worksheet.getCell(rowNumber, statusColumn);
      const color = cell.value === 'Present'
        ? workbookColors.green
        : cell.value === 'Absent'
          ? workbookColors.red
          : workbookColors.amber;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      cell.font = { bold: true, color: { argb: workbookColors.text }, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  return worksheet;
}

// GET /api/reports/export?from=YYYY-MM-DD&to=YYYY-MM-DD (admin only)
async function exportAttendance(req, res, next) {
  try {
    const { from, to } = req.query;
    if (!isValidDateString(from) || !isValidDateString(to)) {
      return res.status(400).json({ message: 'from and to must be valid YYYY-MM-DD values.' });
    }
    if (from > to) {
      return res.status(400).json({ message: 'from must be earlier than or equal to to.' });
    }
    if (to > todayIST()) {
      return res.status(400).json({ message: 'to cannot be a future date.' });
    }

    const dates = getDateRange(from, to);
    if (dates.length > MAX_EXCEL_DATA_ROWS) {
      return res.status(400).json({ message: 'Choose a shorter date range to fit the Excel worksheet.' });
    }

    const [students, volunteers, studentRecords, volunteerRecords] = await Promise.all([
      Student.find({ isActive: true }).select('studentId name className').sort({ name: 1 }).lean(),
      Volunteer.find({ isActive: true }).select('volunteerId name email').sort({ name: 1 }).lean(),
      Attendance.find({ date: { $gte: from, $lte: to } }).sort({ date: 1, studentId: 1 }).lean(),
      VolunteerAttendance.find({ date: { $gte: from, $lte: to } }).sort({ date: 1, volunteerId: 1 }).lean(),
    ]);

    if (students.length * dates.length > MAX_EXCEL_DATA_ROWS
      || volunteers.length * dates.length > MAX_EXCEL_DATA_ROWS) {
      return res.status(400).json({
        message: 'This date range contains too many roster entries for one Excel worksheet. Choose a shorter range.',
      });
    }

    const activeStudentIds = new Set(students.map((student) => student.studentId));
    const activeVolunteerIds = new Set(volunteers.map((volunteer) => volunteer.volunteerId));
    const studentByDate = new Map();
    const volunteerByDate = new Map();

    studentRecords.forEach((record) => {
      if (!activeStudentIds.has(record.studentId)) return;
      if (!studentByDate.has(record.date)) studentByDate.set(record.date, new Map());
      studentByDate.get(record.date).set(record.studentId, record);
    });
    volunteerRecords.forEach((record) => {
      if (!activeVolunteerIds.has(record.volunteerId)) return;
      if (!volunteerByDate.has(record.date)) volunteerByDate.set(record.date, new Map());
      volunteerByDate.get(record.date).set(record.volunteerId, record);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance App';
    workbook.created = new Date();
    workbook.subject = `Attendance from ${from} to ${to}`;
    workbook.title = 'Attendance Export';

    const summary = workbook.addWorksheet('Daily Summary', {
      properties: { tabColor: { argb: workbookColors.navy } },
      views: [{ state: 'frozen', ySplit: 4 }],
    });
    addWorkbookTitle(summary, 11, 'Attendance Export — Daily Summary', `Date range: ${from} to ${to}`);
    summary.addRow([]);
    summary.addRow([
      'Date',
      'Students Total',
      'Students Present',
      'Students Absent',
      'Students Not Marked',
      'Student Attendance',
      'Volunteers Total',
      'Volunteers Present',
      'Volunteers Absent',
      'Volunteers Not Marked',
      'Volunteer Attendance',
    ]);

    dates.forEach((date) => {
      const studentStatuses = studentByDate.get(date) || new Map();
      const volunteerStatuses = volunteerByDate.get(date) || new Map();
      const studentPresent = Array.from(studentStatuses.values()).filter((record) => record.status === 'Present').length;
      const studentAbsent = Array.from(studentStatuses.values()).filter((record) => record.status === 'Absent').length;
      const volunteerPresent = Array.from(volunteerStatuses.values()).filter((record) => record.status === 'Present').length;
      const volunteerAbsent = Array.from(volunteerStatuses.values()).filter((record) => record.status === 'Absent').length;
      const studentTotal = activeStudentIds.size;
      const volunteerTotal = activeVolunteerIds.size;

      summary.addRow([
        date,
        studentTotal,
        studentPresent,
        studentAbsent,
        Math.max(0, studentTotal - studentPresent - studentAbsent),
        studentTotal ? studentPresent / studentTotal : 0,
        volunteerTotal,
        volunteerPresent,
        volunteerAbsent,
        Math.max(0, volunteerTotal - volunteerPresent - volunteerAbsent),
        volunteerTotal ? volunteerPresent / volunteerTotal : 0,
      ]);
    });
    styleTable(summary, 4, 5, summary.rowCount, [14, 14, 16, 15, 17, 18, 15, 17, 16, 18, 19]);
    summary.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: summary.rowCount, column: 11 },
    };
    for (let rowNumber = 5; rowNumber <= summary.rowCount; rowNumber += 1) {
      summary.getCell(rowNumber, 6).numFmt = '0%';
      summary.getCell(rowNumber, 11).numFmt = '0%';
    }

    const rangeLabel = `${from} to ${to}`;
    addAttendanceSheet(workbook, {
      name: 'Student Attendance',
      title: 'Student Attendance Details',
      subtitle: `Recorded attendance · ${rangeLabel}`,
      headers: ['Date', 'Student ID', 'Student Name', 'Class', 'Status', 'Marked By'],
      rows: dates.flatMap((date) => students.map((student) => {
        const record = studentByDate.get(date)?.get(student.studentId);
        return [
          date,
          student.studentId,
          student.name,
          student.className || '',
          record?.status || 'Not Marked',
          record?.markedBy || '',
        ];
      })),
      widths: [14, 16, 28, 18, 15, 18],
      statusColumn: 5,
    });

    addAttendanceSheet(workbook, {
      name: 'Volunteer Attendance',
      title: 'Volunteer Attendance Details',
      subtitle: `Recorded attendance · ${rangeLabel}`,
      headers: ['Date', 'Volunteer ID', 'Volunteer Name', 'Email', 'Status', 'Marked By'],
      rows: dates.flatMap((date) => volunteers.map((volunteer) => {
        const record = volunteerByDate.get(date)?.get(volunteer.volunteerId);
        return [
          date,
          volunteer.volunteerId,
          volunteer.name,
          volunteer.email,
          record?.status || 'Not Marked',
          record?.markedBy || '',
        ];
      })),
      widths: [14, 17, 28, 32, 15, 18],
      statusColumn: 5,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `attendance-export-${from}-to-${to}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
    });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { dailyReport, exportAttendance };
