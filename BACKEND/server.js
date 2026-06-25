const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const ensureDefaultCaregiver = require('./utils/autoSeed');
const Patient = require('./models/Patient');

dotenv.config();

// Connect DB
connectDB()
  .then(() => {
    console.log("MongoDB Connected");
    ensureDefaultCaregiver();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();
const httpServer = http.createServer(app);

// ✅ FIXED CORS (REST API)
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://dementiacare-app.vercel.app"
    ],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO CORS FIX
const io = new Server(httpServer, {
    cors: {
        origin: "https://dementiacare-app.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
    },
});

// SOCKET HANDLER
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('sos-alert', async (data) => {
        try {
            const { patientUserId, timestamp } = data;

            const patient = await Patient.findOne({ user: patientUserId }).lean();

            const caregiverUserId = patient?.assignedCaregiver?.toString() || null;

            const patientName = patient
                ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                : 'Unknown Patient';

            const alertPayload = {
                patientUserId,
                patientName,
                caregiverUserId,
                timestamp: timestamp || new Date().toISOString(),
            };

            console.log(`SOS → ${patientName}`);

            io.emit('sos-alert', alertPayload);

        } catch (err) {
            console.error("SOS handler error:", err);
            io.emit('sos-alert', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/caregiver', require('./routes/caregiverRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes.js'));
app.use('/api/rag', require('./routes/ragRoutes'));

// HEALTH CHECK
app.get('/', (req, res) => {
    res.send('Backend Server Running Successfully 🚀');
});

// ERROR HANDLER
app.use(errorHandler);

// PORT
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with Socket.IO`);
});