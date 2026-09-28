const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Volunteer = require('../models/Volunteer');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/login
// Accepts { id, password } where "id" is the Admin ID, Volunteer ID, or Volunteer email.
async function login(req, res, next) {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ message: 'ID/Email and password are required.' });
    }

    const normalizedId = String(id).trim();

    // 1) Check against the predefined Admin credentials (env-based, not in MongoDB)
    if (
      normalizedId.toLowerCase() === String(process.env.ADMIN_ID).toLowerCase() &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = signToken({ id: 'admin', role: 'admin', name: 'Admin' });
      return res.json({
        token,
        user: { id: 'admin', name: 'Admin', role: 'admin' },
      });
    }

    // 2) Otherwise, check the Volunteer collection (by volunteerId or email)
    const volunteer = await Volunteer.findOne({
      $or: [
        { volunteerId: normalizedId.toUpperCase() },
        { email: normalizedId.toLowerCase() },
      ],
    }).select('+passwordHash');

    if (!volunteer) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!volunteer.isActive) {
      return res.status(403).json({ message: 'This volunteer account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, volunteer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken({
      id: volunteer._id.toString(),
      volunteerId: volunteer.volunteerId,
      role: 'volunteer',
      name: volunteer.name,
    });

    return res.json({
      token,
      user: {
        id: volunteer._id,
        name: volunteer.name,
        volunteerId: volunteer.volunteerId,
        email: volunteer.email,
        role: 'volunteer',
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.json({ id: 'admin', name: 'Admin', role: 'admin' });
    }
    const volunteer = await Volunteer.findById(req.user.id);
    if (!volunteer) return res.status(404).json({ message: 'User not found.' });
    res.json({
      id: volunteer._id,
      name: volunteer.name,
      volunteerId: volunteer.volunteerId,
      email: volunteer.email,
      role: 'volunteer',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
