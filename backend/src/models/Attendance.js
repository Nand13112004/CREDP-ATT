const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true, uppercase: true },
    // Stored as a plain YYYY-MM-DD string (Asia/Kolkata calendar date) to avoid
    // any UTC/timezone shifting issues when querying by date.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, required: true, enum: ['Present', 'Absent'] },
    markedBy: { type: String, required: true }, // volunteerId or "ADMIN"
    markedByRole: { type: String, required: true, enum: ['admin', 'volunteer'] },
  },
  { timestamps: true }
);

// A student can only have ONE attendance record per date.
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
