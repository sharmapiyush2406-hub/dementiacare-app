const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const ensureDefaultCaregiver = require('./utils/autoSeed');
const Patient = require('./models/Patient');


// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
    ensureDefaultCaregiver();
});

const app = express();
const httpServer = http.createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Patient triggers SOS — backend looks up assigned caregiver and broadcasts to ALL
    // with caregiverUserId in payload so only the right caregiver's UI reacts
    socket.on('sos-alert', async (data) => {
        try {
            const { patientUserId, timestamp } = data;

            const patient = await Patient.findOne({ user: patientUserId }).lean();

            const caregiverUserId = patient?.assignedCaregiver?.toString() || null;
            const patientName = patient
                ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient'
                : 'Unknown Patient';

            const alertPayload = {
                patientUserId,
                patientName,
                caregiverUserId,
                timestamp: timestamp || new Date().toISOString(),
            };

            console.log(`SOS from ${patientName} → broadcasting (caregiverUserId: ${caregiverUserId})`);

            // Broadcast to ALL connected sockets — frontend filters by caregiverUserId
            io.emit('sos-alert', alertPayload);
        } catch (err) {
            console.error('SOS handler error:', err);
            io.emit('sos-alert', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/caregiver', require('./routes/caregiverRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes.js'));
app.use('/api/rag', require('./routes/ragRoutes'));

app.get('/', (req, res) => {
    res.send('Backend Server Running Successfully 🚀');
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with Socket.IO`);
});
