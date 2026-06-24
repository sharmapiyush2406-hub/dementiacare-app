const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedCaregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // ── Personal Information ──────────────────────────────────
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: 'Male' },
    address: { type: String, default: '' },

    // ── Medical Information ───────────────────────────────────
    bloodGroup: { type: String, default: '' },
    age: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
    conditions: { type: String, default: '' },
    allergies: { type: String, default: '' },
    currentMedications: { type: String, default: '' },
    primaryDoctor: { type: String, default: '' },
    lastVisit: { type: String, default: '' },
    nextAppointment: { type: String, default: '' },

    // ── Emergency Contacts ────────────────────────────────────
    emergency: {
        contactName: { type: String, default: '' },
        relationship: { type: String, default: '' },
        contactPhone: { type: String, default: '' },
        contactEmail: { type: String, default: '' },
        altContactName: { type: String, default: '' },
        altRelationship: { type: String, default: '' },
        altPhone: { type: String, default: '' },
    },

    // ── Preferences ───────────────────────────────────────────
    preferences: {
        medicationReminders: { type: Boolean, default: true },
        appointmentAlerts: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: false },
        smsNotifications: { type: Boolean, default: true },
        language: { type: String, default: 'English' },
        timezone: { type: String, default: 'UTC-5 (Eastern)' },
    },
}, { timestamps: true });

const { triggerReindex } = require('../utils/autoIndex');

patientSchema.post('save', function(doc) {
    triggerReindex(doc._id);
});

module.exports = mongoose.model('Patient', patientSchema);

