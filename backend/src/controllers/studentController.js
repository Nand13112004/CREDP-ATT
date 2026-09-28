const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// GET /api/students?search=&activeOnly=
async function getStudents(req, res, next) {
  try {
    const { search, activeOnly } = req.query;
    const filter = {};

    if (activeOnly === 'true') filter.isActive = true;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { studentId: regex }];
    }

    const students = await Student.find(filter).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id
async function getStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

// POST /api/students
async function createStudent(req, res, next) {
  try {
    const { studentId, name, email, phone, className } = req.body;

    if (!studentId || !name) {
      return res.status(400).json({ message: 'Student ID and name are required.' });
    }

    const student = await Student.create({
      studentId: studentId.trim().toUpperCase(),
      name: name.trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      className: (className || '').trim(),
    });

    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A student with this Student ID already exists.' });
    }
    next(err);
  }
}

// PUT /api/students/:id
async function updateStudent(req, res, next) {
  try {
    const { name, email, phone, className, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (email !== undefined) update.email = email.trim();
    if (phone !== undefined) update.phone = phone.trim();
    if (className !== undefined) update.className = className.trim();
    if (isActive !== undefined) update.isActive = isActive;

    const student = await Student.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/students/:id
async function deleteStudent(req, res, next) {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    // Clean up attendance history tied to this student
    await Attendance.deleteMany({ studentId: student.studentId });
    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent };
