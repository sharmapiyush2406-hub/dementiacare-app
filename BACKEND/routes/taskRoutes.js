const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Helper to validate input date
const isValidDate = (d) => {
    return d instanceof Date && !isNaN(d);
};

// @desc    Get dashboard statistics for tasks
// @route   GET /api/tasks/stats
// @access  Private (Patient, Caregiver)
router.get('/stats', protect, authorize('patient', 'caregiver'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient) {
                return res.status(404).json({ message: 'Patient profile not found' });
            }
            query.patient = patient._id;
        } else if (req.user.role === 'caregiver') {
            const caregiver = await Caregiver.findOne({ user: req.user.id });
            if (!caregiver) {
                return res.status(404).json({ message: 'Caregiver profile not found' });
            }

            const { patientId } = req.query;
            if (patientId) {
                const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
                if (!isAssigned) {
                    return res.status(403).json({ message: 'Not authorized to view stats for this patient' });
                }
                query.patient = patientId;
            } else {
                query.patient = { $in: caregiver.assignedPatients };
            }
        }

        const tasks = await Task.find(query);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const missedTasks = tasks.filter(t => t.status === 'Missed').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            missedTasks,
            completionRate
        });
    } catch (error) {
        console.error('Error fetching task stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Patient, Caregiver)
router.post('/', protect, authorize('patient', 'caregiver'), async (req, res) => {
    try {
        const { title, description, priority, dueDate, category, patientId } = req.body;

        if (!title || !dueDate) {
            return res.status(400).json({ message: 'Task title and due date are required' });
        }

        const parsedDate = new Date(dueDate);
        if (!isValidDate(parsedDate)) {
            return res.status(400).json({ message: 'Invalid due date format' });
        }

        let taskData = {
            title,
            description,
            priority: priority || 'Medium',
            dueDate: parsedDate,
            category: category || 'Other',
            status: 'Pending',
            createdBy: req.user.id
        };

        if (req.user.role === 'caregiver') {
            if (!patientId) {
                return res.status(400).json({ message: 'Patient selection is required for caregivers' });
            }

            const caregiver = await Caregiver.findOne({ user: req.user.id });
            if (!caregiver) {
                return res.status(404).json({ message: 'Caregiver profile not found' });
            }

            const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
            if (!isAssigned) {
                return res.status(403).json({ message: 'This patient is not assigned to you' });
            }

            taskData.patient = patientId;
            taskData.caregiver = caregiver._id;
        } else if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient) {
                return res.status(404).json({ message: 'Patient profile not found' });
            }
            taskData.patient = patient._id;
        }

        const task = await Task.create(taskData);
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all tasks for patient or caregiver patients
// @route   GET /api/tasks
// @access  Private (Patient, Caregiver)
router.get('/', protect, authorize('patient', 'caregiver'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient) {
                return res.status(404).json({ message: 'Patient profile not found' });
            }
            query.patient = patient._id;
        } else if (req.user.role === 'caregiver') {
            const caregiver = await Caregiver.findOne({ user: req.user.id });
            if (!caregiver) {
                return res.status(404).json({ message: 'Caregiver profile not found' });
            }

            const { patientId } = req.query;
            if (patientId) {
                const isAssigned = caregiver.assignedPatients.some(id => id.toString() === patientId.toString());
                if (!isAssigned) {
                    return res.status(403).json({ message: 'Not authorized to view tasks for this patient' });
                }
                query.patient = patientId;
            } else {
                query.patient = { $in: caregiver.assignedPatients };
            }
        }

        // Apply filters
        const { status, priority, category, search } = req.query;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const tasks = await Task.find(query)
            .sort({ dueDate: 1 })
            .populate({
                path: 'patient',
                select: 'firstName lastName user',
                populate: { path: 'user', select: 'email' }
            })
            .populate({
                path: 'caregiver',
                select: 'user',
                populate: { path: 'user', select: 'firstName lastName email' }
            });

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Patient, Caregiver)
router.put('/:id', protect, authorize('patient', 'caregiver'), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { title, description, priority, dueDate, category, status } = req.body;

        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient || task.patient.toString() !== patient._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to modify this task' });
            }

            // Patients can modify status of any of their tasks.
            // But they can only edit description/title/priority/dueDate/category if they created the task themselves.
            const isCreator = task.createdBy.toString() === req.user.id.toString();

            if (status) {
                task.status = status;
            }

            if (isCreator) {
                if (title) task.title = title;
                if (description !== undefined) task.description = description;
                if (priority) task.priority = priority;
                if (category) task.category = category;
                if (dueDate) {
                    const parsedDate = new Date(dueDate);
                    if (!isValidDate(parsedDate)) {
                        return res.status(400).json({ message: 'Invalid due date format' });
                    }
                    task.dueDate = parsedDate;
                }
            } else {
                // If patient is trying to edit other fields of a caregiver task, reject
                if (title || description !== undefined || priority || dueDate || category) {
                    return res.status(403).json({ message: 'Patients can only update the status of tasks assigned by caregivers' });
                }
            }
        } else if (req.user.role === 'caregiver') {
            const caregiver = await Caregiver.findOne({ user: req.user.id });
            const isAssigned = caregiver && caregiver.assignedPatients.some(id => id.toString() === task.patient.toString());
            if (!caregiver || !isAssigned) {
                return res.status(403).json({ message: 'Not authorized to modify tasks for this patient' });
            }

            // Caregiver has full edit rights
            if (title) task.title = title;
            if (description !== undefined) task.description = description;
            if (priority) task.priority = priority;
            if (category) task.category = category;
            if (status) task.status = status;
            if (dueDate) {
                const parsedDate = new Date(dueDate);
                if (!isValidDate(parsedDate)) {
                    return res.status(400).json({ message: 'Invalid due date format' });
                }
                task.dueDate = parsedDate;
            }
        }

        const updatedTask = await task.save();
        
        // Populate patient details for return object
        const populatedTask = await Task.findById(updatedTask._id)
            .populate({
                path: 'patient',
                select: 'firstName lastName user',
                populate: { path: 'user', select: 'email' }
            })
            .populate({
                path: 'caregiver',
                select: 'user',
                populate: { path: 'user', select: 'firstName lastName email' }
            });

        res.json(populatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete (soft-delete) a task
// @route   DELETE /api/tasks/:id
// @access  Private (Patient, Caregiver)
router.delete('/:id', protect, authorize('patient', 'caregiver'), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ user: req.user.id });
            if (!patient || task.patient.toString() !== patient._id.toString()) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            // Patients can only delete tasks they created themselves (e.g. personal reminders)
            const isCreator = task.createdBy.toString() === req.user.id.toString();
            if (!isCreator) {
                return res.status(403).json({ message: 'Patients can only delete tasks they created themselves' });
            }
        } else if (req.user.role === 'caregiver') {
            const caregiver = await Caregiver.findOne({ user: req.user.id });
            const isAssigned = caregiver && caregiver.assignedPatients.some(id => id.toString() === task.patient.toString());
            if (!caregiver || !isAssigned) {
                return res.status(403).json({ message: 'Not authorized to delete tasks for this patient' });
            }
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Task deleted successfully', taskId: task._id });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
