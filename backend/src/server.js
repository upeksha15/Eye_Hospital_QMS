import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import connectDB from '../config/db.js';
import { initQueueSocket } from './socket/queueSocket.js';

import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/auth.js';
import doctorsRoutes from './routes/doctors.js';
import slotsRoutes from './routes/slots.js';
import appointmentsRoutes from './routes/appointments.js';
import queueRoutes from './routes/queue.js';
import announcementsRoutes from './routes/announcements.js';


// ✅ NEW IMPORT
import doctorRoomRoutes from './routes/doctorRoomRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

// ================= Middleware =================
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());

// ================= Health Check =================
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// ================= Routes =================
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/announcements', announcementsRoutes);

// ✅ NEW ROUTE
app.use('/api/doctor-rooms', doctorRoomRoutes);

// ================= Socket.IO =================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: clientUrl, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});
app.set('io', io);
initQueueSocket(io);

// ================= Database =================
connectDB();

// ================= Start Server =================
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});