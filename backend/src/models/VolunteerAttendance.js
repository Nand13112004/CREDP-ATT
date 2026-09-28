const mongoose = require('mongoose');

const volunteerAttendanceSchema = new mongoose.Schema(
  {
    volunteerId: { type: String, required: true, trim: true, uppercase: true },
    // Stored as a plain YYYY-MM-DD string (Asia/Kolkata calendar date) to avoid
    // any UTC/timezone shifting issues when querying by date.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, required: true, enum: ['Present', 'Absent'] },
    markedBy: { type: String, required: true, default: 'ADMIN' },
  },
  { timestamps: true }
);

// A volunteer can only have ONE attendance record per date.
volunteerAttendanceSchema.index({ volunteerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerAttendance', volunteerAttendanceSchema);
