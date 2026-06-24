const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    category: {
        type: String,
        enum: ['Medication', 'Appointment', 'Exercise', 'Personal', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Missed'],
        default: 'Pending'
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient reference is required']
    },
    caregiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by reference is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const { triggerReindex } = require('../utils/autoIndex');

taskSchema.post('save', function (doc) {
    triggerReindex(doc.patient);
});

taskSchema.post('remove', function (doc) {
    triggerReindex(doc.patient);
});

taskSchema.post('deleteOne', { document: true, query: false }, function (doc) {
    triggerReindex(doc.patient);
});

taskSchema.post('findOneAndDelete', function (doc) {
    if (doc) {
        triggerReindex(doc.patient);
    }
});

module.exports = mongoose.model('Task', taskSchema);
