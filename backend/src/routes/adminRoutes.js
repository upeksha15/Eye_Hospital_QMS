import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as admin from '../controllers/adminController.js';
import * as reports from '../controllers/reportsController.js';

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get('/dashboard/stats', admin.getDashboardStats);
router.get('/dashboard/chart', admin.getChartSeries);
router.get('/dashboard/recent-activity', admin.getRecentActivity);
router.get('/dashboard/doctors-summary', admin.getDoctorsSummary);
router.get('/dashboard/today-appointments', admin.getTodayAppointmentsDetail);
router.get('/dashboard/active-queues', admin.getActiveQueuesDetail);
router.get('/dashboard/waiting-times', admin.getWaitingTimeDetail);
router.get('/notifications', admin.getNotifications);
router.get('/system/health', admin.getSystemHealth);
router.get('/performance', admin.getPerformanceMetrics);

router.get('/audit-logs', admin.listAuditLogs);

router.get('/patients', admin.listPatients);
router.get('/staff-accounts', admin.listStaffAccounts);
router.post('/staff-accounts', admin.createStaffAccount);
router.put('/staff-accounts/:id', admin.updateStaffAccount);
router.delete('/staff-accounts/:id', admin.deleteStaffAccount);

router.get('/reports/appointments', reports.getReportSummary);
router.get('/reports/appointments.pdf', reports.getReportPdf);
router.get('/reports/patient-details-summary', reports.getPatientDetailsSummary);
router.get('/reports/patient-details-summary.pdf', reports.getPatientDetailsSummaryPdf);

router.get('/doctors', admin.listDoctorsAdmin);
router.post('/doctors', admin.createDoctor);
router.put('/doctors/:id', admin.updateDoctor);
router.delete('/doctors/:id', admin.deleteDoctor);

router.get('/doctor-rooms', admin.listDoctorRoomsAdmin);
router.post('/doctor-rooms', admin.createDoctorRoomAdmin);
router.put('/doctor-rooms/:id', admin.updateDoctorRoomAdmin);
router.delete('/doctor-rooms/:id', admin.deleteDoctorRoomAdmin);

router.get('/schedules', admin.getSchedulesOverview);
router.post('/schedules/daily-slot', admin.upsertDailySlot);

router.get('/announcements', admin.listAnnouncementsAdmin);
router.post('/announcements', admin.createAnnouncementAdmin);
router.put('/announcements/:id', admin.updateAnnouncementAdmin);
router.delete('/announcements/:id', admin.deleteAnnouncementAdmin);

router.get('/settings', admin.getSettings);
router.patch('/settings', admin.updateSettings);

export default router;
