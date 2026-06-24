const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'caregiver', 'patient', 'doctor'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // ── Shared Profile Fields (admin + doctor) ────────────────
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    employeeId: { type: String, default: '' },

    // ── Doctor-Specific Profile Fields ────────────────────────
    specialization: { type: String, default: '' },
    licenseNo: { type: String, default: '' },
    hospital: { type: String, default: '' },
    experience: { type: String, default: '' },
    opdTiming: { type: String, default: '' },
    ward: { type: String, default: '' },

    // ── Notification Preferences (admin + doctor) ─────────────
    notifications: {
        emailAlerts: { type: Boolean, default: true },
        smsAlerts: { type: Boolean, default: false },
        newPatientAlert: { type: Boolean, default: true },
        caregiverAssignment: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: false },
        weeklyReport: { type: Boolean, default: true },
        appointmentReminders: { type: Boolean, default: true },
        patientAlerts: { type: Boolean, default: true },
        reportUpdates: { type: Boolean, default: true },
        emailDigest: { type: Boolean, default: true },
    },

    // ── System Preferences ────────────────────────────────────
    preferences: {
        darkMode: { type: Boolean, default: false },
        language: { type: String, default: 'English' },
        timezone: { type: String, default: 'UTC-5 (Eastern)' },
        dateFormat: { type: String, default: 'MM/DD/YYYY' },
    },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
