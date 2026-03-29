import PDFDocument from 'pdfkit';
import Appointment from '../models/Appointment.js';
import { startOfDayColombo, formatYMD } from '../utils/dateUtils.js';

const TZ = 'Asia/Colombo';

function addMonths(y, m, delta) {
  let nm = m + delta;
  let ny = y;
  while (nm < 1) {
    nm += 12;
    ny -= 1;
  }
  while (nm > 12) {
    nm -= 12;
    ny += 1;
  }
  return { y: ny, m: nm };
}

function monthBoundsColombo(y, m) {
  const start = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00+05:30`);
  const next = addMonths(y, m, 1);
  const end = new Date(`${next.y}-${String(next.m).padStart(2, '0')}-01T00:00:00+05:30`);
  return { start, end, label: `${y}-${String(m).padStart(2, '0')}` };
}

function startOfWeekMondayColombo(dateInput) {
  const sod = startOfDayColombo(dateInput);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).formatToParts(sod);
  const w = parts.find((p) => p.type === 'weekday')?.value;
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = map[w] ?? 0;
  const daysFromMonday = (dow + 6) % 7;
  return new Date(sod.getTime() - daysFromMonday * 86400000);
}

function linearPredict(values) {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return Math.max(0, Math.round(values[0]));
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return Math.max(0, Math.round(sumY / n));
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return Math.max(0, Math.round(a + b * n));
}

async function bucketStats(start, end) {
  const q = { appointmentDate: { $gte: start, $lt: end } };
  const appointmentCount = await Appointment.countDocuments(q);
  const patientIds = await Appointment.distinct('patientId', q);
  return {
    appointmentCount,
    uniquePatientCount: patientIds.length,
  };
}

export async function buildAppointmentReport({ granularity = 'week', referenceDate } = {}) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const refDay = startOfDayColombo(ref);

  const buckets = [];

  if (granularity === 'week') {
    const monday = startOfWeekMondayColombo(refDay);
    for (let w = 0; w < 4; w++) {
      const start = new Date(monday.getTime() - (3 - w) * 7 * 86400000);
      const end = new Date(start.getTime() + 7 * 86400000);
      const stats = await bucketStats(start, end);
      buckets.push({
        label: `${formatYMD(start)} → ${formatYMD(new Date(end.getTime() - 86400000))}`,
        start: start.toISOString(),
        end: end.toISOString(),
        ...stats,
      });
    }
  } else {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(refDay);
    const y = parseInt(parts.find((p) => p.type === 'year')?.value, 10);
    const m = parseInt(parts.find((p) => p.type === 'month')?.value, 10);

    for (let i = 5; i >= 0; i--) {
      const { y: yy, m: mm } = addMonths(y, m, -i);
      const { start, end, label } = monthBoundsColombo(yy, mm);
      const stats = await bucketStats(start, end);
      buckets.push({
        label,
        start: start.toISOString(),
        end: end.toISOString(),
        ...stats,
      });
    }
  }

  const apptSeries = buckets.map((b) => b.appointmentCount);
  const uniqueSeries = buckets.map((b) => b.uniquePatientCount);

  const predictedAppointments = linearPredict(apptSeries);
  const predictedUniquePatients = linearPredict(uniqueSeries);

  return {
    granularity,
    referenceDate: refDay.toISOString(),
    buckets,
    prediction: {
      method: 'linear_trend_on_buckets',
      nextPeriodAppointments: predictedAppointments,
      nextPeriodUniquePatients: predictedUniquePatients,
      note:
        'Forecasts extend the recent trend from the displayed periods. Use alongside clinical planning.',
    },
  };
}

export async function getReportSummary(req, res) {
  try {
    const { granularity = 'week', referenceDate } = req.query;
    if (!['week', 'month'].includes(granularity)) {
      return res.status(400).json({ success: false, message: 'granularity must be week or month' });
    }
    const report = await buildAppointmentReport({ granularity, referenceDate });
    res.json({ success: true, report });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Report failed' });
  }
}

export async function getReportPdf(req, res) {
  try {
    const { granularity = 'week', referenceDate } = req.query;
    if (!['week', 'month'].includes(granularity)) {
      return res.status(400).json({ success: false, message: 'granularity must be week or month' });
    }
    const report = await buildAppointmentReport({ granularity, referenceDate });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qms-appointments-${granularity}-${formatYMD(new Date())}.pdf"`
    );
    doc.pipe(res);

    doc.fontSize(18).text('Eye Hospital — OPD Queue Management', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('Appointment & patient volume report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#444').text(`Period mode: ${granularity === 'week' ? 'Week-wise (4 weeks)' : 'Month-wise (6 months)'}`, {
      align: 'left',
    });
    doc.text(`Generated: ${new Date().toLocaleString('en-GB', { timeZone: TZ })} (Colombo)`, {
      align: 'left',
    });
    doc.moveDown();
    doc.fillColor('#000');

    doc.fontSize(11).text('Buckets', { underline: true });
    doc.moveDown(0.3);
    report.buckets.forEach((b) => {
      doc.fontSize(10).text(
        `${b.label}: ${b.appointmentCount} appointments, ${b.uniquePatientCount} unique patients`,
        { indent: 10 }
      );
    });
    doc.moveDown();
    doc.fontSize(11).text('Trend-based forecast (next period)', { underline: true });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .text(
        `Predicted appointments: ${report.prediction.nextPeriodAppointments} · Predicted unique patients: ${report.prediction.nextPeriodUniquePatients}`
      );
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#666').text(report.prediction.note, { align: 'left' });

    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: e.message || 'PDF failed' });
    }
  }
}
