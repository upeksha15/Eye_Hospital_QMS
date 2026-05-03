import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import connectDB from '../config/db.js';
import { initQueueSocket } from './socket/queueSocket.js';
import QueueToken from './models/QueueToken.js';
import { startOfDayColombo, nowColombo } from './utils/dateUtils.js';

import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/auth.js';
import doctorsRoutes from './routes/doctors.js';
import slotsRoutes from './routes/slots.js';
import appointmentsRoutes from './routes/appointments.js';
import queueRoutes from './routes/queue.js';
import checkinRoutes from './routes/checkin.js';
import announcementsRoutes from './routes/announcements.js';
import staffRoutes from './routes/staff.js';
import followUpsRoutes from './routes/followUps.js';
import feedbackRoutes from './routes/feedback.js';


// ✅ NEW IMPORT
import doctorRoomRoutes from './routes/doctorRoomRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';

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

// Increase payload size limit to handle base64 images (up to 5MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/api/checkin', checkinRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/follow-ups', followUpsRoutes);
app.use('/api/feedback', feedbackRoutes);

// ✅ NEW ROUTE
app.use('/api/doctor-rooms', doctorRoomRoutes);
// Admin-only API surface (protected via auth + admin role middleware inside router).
app.use('/api/admin', adminRoutes);
// Notices API
app.use('/api/notices', noticeRoutes);

// ================= Socket.IO =================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: clientUrl, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});
app.set('io', io);
initQueueSocket(io);

// ================= Database & Start Server =================
const startServer = async () => {
  const dbConnected = await connectDB();

  if (!dbConnected) {
    console.warn('⚠️ Proceeding without a DB connection. Database operations will error immediately.');
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Schedule end-of-day cleanup at 17:00 Colombo time to finalize skipped patients
  const scheduleEndOfDayCleanup = () => {
    const now = nowColombo();
    const todayStart = startOfDayColombo(now);
    const end = new Date(todayStart);
    end.setHours(17, 0, 0, 0);

    let delay = end.getTime() - now.getTime();
    if (delay <= 0) {
      // if already past 5pm today, schedule for next day
      end.setDate(end.getDate() + 1);
      delay = end.getTime() - now.getTime();
    }

    setTimeout(async function runCleanup() {
      try {
        const cleanupStart = startOfDayColombo(nowColombo());
        const cleanupEnd = new Date(cleanupStart);
        cleanupEnd.setDate(cleanupEnd.getDate() + 1);

        // find today's skipped tokens
        const skipped = await QueueToken.find({ status: 'absent', checkinTime: { $gte: cleanupStart, $lt: cleanupEnd } }).lean();
        const doctorIds = Array.from(new Set(skipped.map((s) => String(s.doctorId))));

        if (skipped.length > 0) {
          // mark them completed so they no longer appear in waiting/called lists
          await QueueToken.updateMany({ _id: { $in: skipped.map((s) => s._id) } }, { status: 'completed' });

          // emit socket updates per affected doctor
          const io = app.get('io');
          for (const did of doctorIds) {
            const totalWaiting = await QueueToken.countDocuments({ doctorId: did, status: 'waiting', checkinTime: { $gte: cleanupStart, $lt: cleanupEnd } });
            if (io) {
              io.to(`queue:${String(did)}`).emit('queue:update', {
                doctorId: String(did),
                action: 'endOfDayCleanup',
                removedCount: skipped.filter(s => String(s.doctorId) === String(did)).length,
                totalWaiting,
              });
            }
          }
          console.log(`End-of-day cleanup: finalized ${skipped.length} skipped tokens.`);
        }
      } catch (e) {
        console.error('End-of-day cleanup failed', e);
      }

      // schedule next run in 24h
      setTimeout(runCleanup, 24 * 60 * 60 * 1000);
    }, delay + 1000);
  };

  scheduleEndOfDayCleanup();
};

startServer();