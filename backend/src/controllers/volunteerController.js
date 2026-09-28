const bcrypt = require('bcryptjs');
const Volunteer = require('../models/Volunteer');
const VolunteerAttendance = require('../models/VolunteerAttendance');

// GET /api/volunteers?activeOnly=&search=
async function getVolunteers(req, res, next) {
  try {
    const { activeOnly, search } = req.query;
    const filter = {};

    if (activeOnly === 'true') filter.isActive = true;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { volunteerId: regex }, { email: regex }];
    }

    const volunteers = await Volunteer.find(filter).sort({ name: 1 });
    res.json(volunteers);
  } catch (err) {
    next(err);
  }
}

// POST /api/volunteers  (admin only)
async function createVolunteer(req, res, next) {
  try {
    const { name, volunteerId, email, password } = req.body;

    if (!name || !volunteerId || !email || !password) {
      return res.status(400).json({ message: 'Name, Volunteer ID, email, and password are all required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const volunteer = await Volunteer.create({
      name: name.trim(),
      volunteerId: volunteerId.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    const { passwordHash: _omit, ...safe } = volunteer.toObject();
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A volunteer with this Volunteer ID or email already exists.' });
    }
    next(err);
  }
}

// PUT /api/volunteers/:id (admin only)
async function updateVolunteer(req, res, next) {
  try {
    const { name, email, password, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (email !== undefined) update.email = email.trim().toLowerCase();
    if (isActive !== undefined) update.isActive = isActive;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found.' });
    res.json(volunteer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
    next(err);
  }
}

// DELETE /api/volunteers/:id (admin only)
async function deleteVolunteer(req, res, next) {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found.' });
    // Clean up attendance history tied to this volunteer
    await VolunteerAttendance.deleteMany({ volunteerId: volunteer.volunteerId });
    res.json({ message: 'Volunteer deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVolunteers, createVolunteer, updateVolunteer, deleteVolunteer };
