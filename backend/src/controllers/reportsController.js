import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { startOfDayColombo, formatYMD } from '../utils/dateUtils.js';

const TZ = 'Asia/Colombo';
const NON_CANCELLED = { status: { $ne: 'cancelled' } };

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

async function bucketStats(start, end, doctorId) {
  const q = { appointmentDate: { $gte: start, $lt: end }, ...NON_CANCELLED };
  if (doctorId) q.doctorId = doctorId;
  const appointmentCount = await Appointment.countDocuments(q);
  const patientIds = await Appointment.distinct('patientId', q);
  return {
    appointmentCount,
    uniquePatientCount: patientIds.length,
  };
}

async function getDailyStats(date, doctorId) {
  const start = startOfDayColombo(date);
  const end = new Date(start.getTime() + 86400000);
  const q = { appointmentDate: { $gte: start, $lt: end }, ...NON_CANCELLED };
  if (doctorId) q.doctorId = doctorId;
  const appointmentCount = await Appointment.countDocuments(q);
  return appointmentCount;
}

function linearPredictDaily(values) {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return Math.max(0, values[0]);
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

async function buildDailyReport({ referenceDate, doctorId } = {}) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const refDay = startOfDayColombo(ref);
  const thisMonday = startOfWeekMondayColombo(refDay);
  const nextMonday = new Date(thisMonday.getTime() + 7 * 86400000);
  const nextSunday = new Date(nextMonday.getTime() + 6 * 86400000);

  const days = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let d = 0; d < 14; d++) {
    const dayDate = new Date(thisMonday.getTime() + d * 86400000);
    const dayOfWeek = d % 7;
    const isNextWeek = d >= 7;
    const appointmentCount = isNextWeek ? null : await getDailyStats(dayDate, doctorId);
    days.push({
      date: formatYMD(dayDate),
      label: dayNames[dayOfWeek],
      appointmentCount: appointmentCount ?? 0,
      isActual: !isNextWeek,
    });
  }

  const actualCounts = days.slice(0, 7).map((d) => d.appointmentCount);
  const avgDaily = actualCounts.length > 0 ? Math.round(actualCounts.reduce((a, b) => a + b, 0) / actualCounts.length) : 0;
  const totalWeek = actualCounts.reduce((a, b) => a + b, 0);

  return {
    days,
    dailyAverage: avgDaily,
    totalWeek,
  };
}

function buildPredictionRange(values, predicted) {
  if (!values.length || predicted == null) {
    return { min: predicted ?? 0, max: predicted ?? 0 };
  }
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const margin = Math.max(1, Math.round(stdDev));
  return {
    min: Math.max(0, Math.round(predicted - margin)),
    max: Math.max(0, Math.round(predicted + margin)),
  };
}

export async function buildAppointmentReport({ granularity = 'week', referenceDate, doctorId } = {}) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const refDay = startOfDayColombo(ref);
  const doctorFilter = mongoose.Types.ObjectId.isValid(doctorId)
    ? new mongoose.Types.ObjectId(doctorId)
    : null;

  const buckets = [];

  if (granularity === 'week') {
    const monday = startOfWeekMondayColombo(refDay);
    for (let w = 0; w < 4; w++) {
      const start = new Date(monday.getTime() - (3 - w) * 7 * 86400000);
      const end = new Date(start.getTime() + 7 * 86400000);
      const stats = await bucketStats(start, end, doctorFilter);
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
      const stats = await bucketStats(start, end, doctorFilter);
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
  const appointmentRange = buildPredictionRange(apptSeries, predictedAppointments);
  const uniquePatientRange = buildPredictionRange(uniqueSeries, predictedUniquePatients);

  const dailyReport = await buildDailyReport({ referenceDate, doctorId: doctorFilter });

  return {
    granularity,
    referenceDate: refDay.toISOString(),
    buckets,
    prediction: {
      method: 'linear_trend_on_buckets',
      nextPeriodAppointments: predictedAppointments,
      nextPeriodUniquePatients: predictedUniquePatients,
      appointmentRange,
      uniquePatientRange,
      note:
        'Forecasts extend the recent trend from the displayed periods. Use alongside clinical planning.',
    },
    daily: dailyReport,
  };
}

export async function getReportSummary(req, res) {
  try {
    const { granularity = 'week', referenceDate, doctorId } = req.query;
    if (!['week', 'month'].includes(granularity)) {
      return res.status(400).json({ success: false, message: 'granularity must be week or month' });
    }
    const report = await buildAppointmentReport({ granularity, referenceDate, doctorId });
    res.json({ success: true, report });
  } catch (e) {
    console.error('Error in getReportSummary:', e);
    res.status(500).json({ success: false, message: e.message || 'Report failed' });
  }
}

async function buildWeekPatientList(start, end) {
  const appts = await Appointment.find({
    appointmentDate: { $gte: start, $lt: end },
    ...NON_CANCELLED,
  })
    .populate('patientId', 'fullName nic contactNumber')
    .lean();

  const map = new Map();
  for (const a of appts) {
    const p = a.patientId;
    if (!p) continue;
    const id = String(p._id);
    if (!map.has(id)) {
      map.set(id, {
        patientId: id,
        fullName: p.fullName || '—',
        nic: p.nic || '—',
        contactNumber: (p.contactNumber || '').trim() || '—',
        appointmentCount: 0,
        lastAppointmentDate: a.appointmentDate,
      });
    }
    const row = map.get(id);
    row.appointmentCount += 1;
    if (new Date(a.appointmentDate) > new Date(row.lastAppointmentDate)) {
      row.lastAppointmentDate = a.appointmentDate;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** This calendar week (Mon 00:00 → next Mon 00:00, Colombo) vs previous week + next-week patient forecast + week-by-week patient lists. */
async function buildPatientDetailsSummary({ referenceDate } = {}) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const refDay = startOfDayColombo(ref);
  const thisMonday = startOfWeekMondayColombo(refDay);
  const nextMonday = new Date(thisMonday.getTime() + 7 * 86400000);
  const prevMonday = new Date(thisMonday.getTime() - 7 * 86400000);

  const qThis = {
    appointmentDate: { $gte: thisMonday, $lt: nextMonday },
    ...NON_CANCELLED,
  };
  const qPrev = {
    appointmentDate: { $gte: prevMonday, $lt: thisMonday },
    ...NON_CANCELLED,
  };

  const [thisAppt, prevAppt] = await Promise.all([
    Appointment.countDocuments(qThis),
    Appointment.countDocuments(qPrev),
  ]);
  const [thisPatients, prevPatients] = await Promise.all([
    Appointment.distinct('patientId', qThis),
    Appointment.distinct('patientId', qPrev),
  ]);

  const thisWeekUnique = thisPatients.length;
  const previousWeekUnique = prevPatients.length;

  let growthRate = 0.1;
  if (previousWeekUnique > 0) {
    growthRate = (thisWeekUnique - previousWeekUnique) / previousWeekUnique;
  }
  growthRate = Math.max(-0.3, Math.min(0.5, growthRate));

  const predictedNextWeekPatientCount = Math.max(
    0,
    Math.round(thisWeekUnique * (1 + growthRate))
  );

  const nextWeekStart = nextMonday;
  const nextWeekEnd = new Date(nextMonday.getTime() + 7 * 86400000);

  const WEEKS_LOOKBACK = 4;
  const weekByWeek = await Promise.all(
    Array.from({ length: WEEKS_LOOKBACK }, (_, j) => WEEKS_LOOKBACK - 1 - j).map(async (i) => {
      const wStart = new Date(thisMonday.getTime() - i * 7 * 86400000);
      const wEnd = new Date(wStart.getTime() + 7 * 86400000);
      const qW = { appointmentDate: { $gte: wStart, $lt: wEnd }, ...NON_CANCELLED };
      const [appointmentCount, patients, distinctIds] = await Promise.all([
        Appointment.countDocuments(qW),
        buildWeekPatientList(wStart, wEnd),
        Appointment.distinct('patientId', qW),
      ]);
      return {
        label: `${formatYMD(wStart)} → ${formatYMD(new Date(wEnd.getTime() - 86400000))}`,
        start: wStart.toISOString(),
        end: wEnd.toISOString(),
        appointmentCount,
        uniquePatientCount: distinctIds.length,
        patients,
      };
    })
  );

  return {
    referenceDate: refDay.toISOString(),
    thisWeek: {
      label: `${formatYMD(thisMonday)} → ${formatYMD(new Date(nextMonday.getTime() - 86400000))}`,
      start: thisMonday.toISOString(),
      end: nextMonday.toISOString(),
      appointmentCount: thisAppt,
      uniquePatientCount: thisWeekUnique,
      patients: weekByWeek[weekByWeek.length - 1]?.patients || [],
    },
    previousWeek: {
      label: `${formatYMD(prevMonday)} → ${formatYMD(new Date(thisMonday.getTime() - 86400000))}`,
      start: prevMonday.toISOString(),
      end: thisMonday.toISOString(),
      appointmentCount: prevAppt,
      uniquePatientCount: previousWeekUnique,
      patients: weekByWeek[weekByWeek.length - 2]?.patients || [],
    },
    weekByWeek,
    prediction: {
      targetLabel: `${formatYMD(nextWeekStart)} → ${formatYMD(new Date(nextWeekEnd.getTime() - 86400000))}`,
      nextWeekStart: nextWeekStart.toISOString(),
      nextWeekEnd: nextWeekEnd.toISOString(),
      predictedNextWeekPatientCount,
      growthRate,
      method:
        'Week-over-week change in unique patients (this week vs previous week), applied to forecast next week.',
    },
  };
}

const PDF_BRAND = '#001f3f';
const PDF_ACCENT = '#0d9488';
const PDF_MUTED = '#64748b';
const PDF_PANEL = '#f8fafc';

function fmtDatePdf(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function drawEyeLogoPdf(doc, x, y, size = 36) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  doc.save();
  doc.lineWidth(2);
  doc.strokeColor(PDF_BRAND);
  doc.ellipse(cx, cy, size * 0.42, size * 0.2).stroke();
  doc.fillColor(PDF_ACCENT);
  doc.circle(cx, cy, size * 0.11).fill();
  doc.fillColor('#ffffff');
  doc.circle(cx + size * 0.05, cy - size * 0.04, size * 0.04).fill();
  doc.restore();
}

function drawPatientDetailsPdfHeader(doc, opts = {}) {
  const { compact = false } = opts;
  const left = 50;
  const w = doc.page.width - 100;
  const y = doc.y;
  const size = compact ? 28 : 40;
  doc.save();
  doc.roundedRect(left, y - 6, w, compact ? 46 : 58, 6).fill(PDF_PANEL);
  doc.restore();
  drawEyeLogoPdf(doc, left, y, size);
  const textX = left + size + 12;
  doc.fillColor(PDF_BRAND).font('Helvetica-Bold').fontSize(compact ? 11 : 15);
  doc.text('National Eye Hospital', textX, y + 6, { width: w - size - 12 });
  doc.font('Helvetica').fontSize(compact ? 8 : 9).fillColor(PDF_MUTED);
  doc.text('Sri Lanka · OPD Queue Management', textX, y + (compact ? 22 : 26), { width: w - size - 12 });
  const titleY = y + (compact ? 36 : 44);
  doc.font('Helvetica-Bold').fontSize(compact ? 11 : 13).fillColor(PDF_BRAND);
  doc.text('Patient details summary report', left, titleY, { width: w, align: 'center' });
  const lineY = titleY + (compact ? 16 : 18);
  doc.moveTo(left, lineY).lineTo(left + w, lineY).opacity(0.35).strokeColor(PDF_BRAND).lineWidth(0.75).stroke();
  doc.opacity(1);
  doc.y = lineY + 10;
}

function truncateForWidth(doc, text, fontSize, maxW) {
  doc.font('Helvetica').fontSize(fontSize);
  const s = String(text ?? '');
  if (doc.widthOfString(s) <= maxW) return s;
  let e = s.length;
  while (e > 0 && doc.widthOfString(`${s.slice(0, e)}…`) > maxW) e -= 1;
  return e <= 0 ? '…' : `${s.slice(0, e)}…`;
}

function ensurePdfSpace(doc, minYFromBottom) {
  const bottom = doc.page.height - minYFromBottom;
  if (doc.y > bottom) {
    doc.addPage();
    drawPatientDetailsPdfHeader(doc, { compact: true });
    doc.moveDown(0.4);
  }
}

function monthTitleLongColombo(y, m) {
  return new Date(`${y}-${String(m).padStart(2, '0')}-15T12:00:00+05:30`).toLocaleDateString('en-GB', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  });
}

/** Monthly aggregates + patient list for “this” calendar month (Colombo) — used for full PDF only. */
async function buildPatientDetailsMonthlyForPdf({ referenceDate } = {}) {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const refDay = startOfDayColombo(ref);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(refDay);
  const y = parseInt(parts.find((p) => p.type === 'year')?.value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month')?.value, 10);

  const { start: tStart, end: tEnd } = monthBoundsColombo(y, m);
  const pm = addMonths(y, m, -1);
  const { start: pStart, end: pEnd } = monthBoundsColombo(pm.y, pm.m);
  const nm = addMonths(y, m, 1);
  const { start: nStart, end: nEnd } = monthBoundsColombo(nm.y, nm.m);

  const qThis = { appointmentDate: { $gte: tStart, $lt: tEnd }, ...NON_CANCELLED };
  const qPrev = { appointmentDate: { $gte: pStart, $lt: pEnd }, ...NON_CANCELLED };

  const [thisAppt, prevAppt] = await Promise.all([
    Appointment.countDocuments(qThis),
    Appointment.countDocuments(qPrev),
  ]);
  const [thisPatients, prevPatients] = await Promise.all([
    Appointment.distinct('patientId', qThis),
    Appointment.distinct('patientId', qPrev),
  ]);

  const thisMonthUnique = thisPatients.length;
  const prevMonthUnique = prevPatients.length;

  let growthRate = 0.1;
  if (prevMonthUnique > 0) {
    growthRate = (thisMonthUnique - prevMonthUnique) / prevMonthUnique;
  }
  growthRate = Math.max(-0.3, Math.min(0.5, growthRate));
  const predictedNextMonthPatientCount = Math.max(0, Math.round(thisMonthUnique * (1 + growthRate)));

  const patients = await buildWeekPatientList(tStart, tEnd);

  const thisMonthBlock = {
    label: monthTitleLongColombo(y, m),
    start: tStart.toISOString(),
    end: tEnd.toISOString(),
    appointmentCount: thisAppt,
    uniquePatientCount: thisMonthUnique,
    patients,
  };

  return {
    referenceDate: refDay.toISOString(),
    thisMonth: thisMonthBlock,
    previousMonth: {
      label: monthTitleLongColombo(pm.y, pm.m),
      start: pStart.toISOString(),
      end: pEnd.toISOString(),
      appointmentCount: prevAppt,
      uniquePatientCount: prevMonthUnique,
    },
    prediction: {
      targetLabel: monthTitleLongColombo(nm.y, nm.m),
      nextMonthStart: nStart.toISOString(),
      nextMonthEnd: nEnd.toISOString(),
      predictedNextMonthPatientCount,
      growthRate,
      method:
        'Month-over-month change in unique patients (this calendar month vs previous calendar month), applied to forecast the next calendar month (Asia/Colombo).',
    },
  };
}

function drawMonthlyKpis(doc, monthly) {
  const left = 50;
  const gap = 8;
  const w = doc.page.width - 100;
  const colW = (w - gap * 2) / 3;
  const y0 = doc.y;
  const rows = [
    { t: 'This month', l: monthly.thisMonth.label, u: monthly.thisMonth.uniquePatientCount, a: monthly.thisMonth.appointmentCount },
    { t: 'Previous month', l: monthly.previousMonth.label, u: monthly.previousMonth.uniquePatientCount, a: monthly.previousMonth.appointmentCount },
    { t: 'Forecast (next month)', l: monthly.prediction.targetLabel, u: monthly.prediction.predictedNextMonthPatientCount, a: null },
  ];
  rows.forEach((row, i) => {
    const x = left + i * (colW + gap);
    doc.save();
    doc.roundedRect(x, y0, colW, 58, 4).fill(PDF_PANEL);
    doc.roundedRect(x, y0, colW, 58, 3).stroke('#e2e8f0');
    doc.fillColor(PDF_BRAND).font('Helvetica-Bold').fontSize(8).text(row.t, x + 8, y0 + 6, { width: colW - 16 });
    doc.font('Helvetica').fontSize(6.5).fillColor(PDF_MUTED).text(row.l, x + 8, y0 + 18, { width: colW - 16 });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(PDF_BRAND).text(String(row.u), x + 8, y0 + 30, { width: colW - 16 });
    if (row.a != null) {
      doc.font('Helvetica').fontSize(6.5).fillColor(PDF_MUTED).text(`Appointments: ${row.a}`, x + 8, y0 + 48, { width: colW - 16 });
    } else {
      doc.font('Helvetica').fontSize(6.5).fillColor(PDF_MUTED).text('Unique patients (est.)', x + 8, y0 + 48, { width: colW - 16 });
    }
    doc.restore();
  });
  doc.y = y0 + 64;
}

function drawPatientWeekTable(doc, summary, week) {
  const left = 50;
  const w = doc.page.width - 100;
  const colW = [w * 0.34, w * 0.2, w * 0.18, w * 0.1, w * 0.18];
  const rowH = 15;
  const headH = 16;
  const patients = week.patients || [];

  ensurePdfSpace(doc, 120);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_BRAND).text(week.label, left, doc.y, { width: w });
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8).fillColor(PDF_MUTED);
  doc.text(
    `${week.uniquePatientCount} unique patients · ${week.appointmentCount} appointments`,
    left,
    doc.y,
    { width: w }
  );
  doc.moveDown(0.5);

  ensurePdfSpace(doc, 80);
  let y = doc.y;
  doc.roundedRect(left, y, w, headH, 3).fill(PDF_BRAND);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  const headers = ['Patient name', 'NIC', 'Contact', 'Appts', 'Last visit'];
  let cx = left + 5;
  headers.forEach((h, i) => {
    doc.text(h, cx, y + 4, { width: colW[i] - 8 });
    cx += colW[i];
  });
  y += headH;

  if (!patients.length) {
    ensurePdfSpace(doc, 40);
    doc.rect(left, y, w, rowH).stroke('#e2e8f0');
    doc.fillColor(PDF_MUTED).font('Helvetica').fontSize(8).text('No appointments in this period.', left + 6, y + 4);
    doc.y = y + rowH + 8;
    return;
  }

  patients.forEach((p, idx) => {
    ensurePdfSpace(doc, rowH + 14);
    y = doc.y;
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(left, y, w, rowH).fill(bg);
    doc.rect(left, y, w, rowH).stroke('#e2e8f0');
    doc.fillColor('#111827').font('Helvetica').fontSize(7);
    cx = left + 5;
    const cells = [
      truncateForWidth(doc, p.fullName, 7, colW[0] - 10),
      truncateForWidth(doc, p.nic, 7, colW[1] - 10),
      truncateForWidth(doc, p.contactNumber, 7, colW[2] - 10),
      String(p.appointmentCount),
      fmtDatePdf(p.lastAppointmentDate),
    ];
    cells.forEach((cell, i) => {
      doc.text(cell, cx, y + 4, { width: colW[i] - 8 });
      cx += colW[i];
    });
    doc.y = y + rowH;
  });
  doc.moveDown(0.6);
}

function buildPatientDetailsMonthlyFullPdf(doc, monthly) {
  drawPatientDetailsPdfHeader(doc, { compact: false });
  const left = 50;
  const w = doc.page.width - 100;
  doc.font('Helvetica').fontSize(8).fillColor(PDF_MUTED);
  doc.text(
    `Reference date: ${fmtDatePdf(monthly.referenceDate)}  ·  Generated ${new Date().toLocaleString('en-GB', { timeZone: TZ })} (Asia/Colombo)`,
    left,
    doc.y,
    { width: w, align: 'center' }
  );
  doc.moveDown(0.8);

  drawMonthlyKpis(doc, monthly);
  doc.moveDown(0.6);

  doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_BRAND).text('Patient register — this calendar month', left, doc.y, { width: w });
  doc.moveDown(0.7);

  drawPatientWeekTable(doc, monthly, monthly.thisMonth);

  ensurePdfSpace(doc, 36);
  doc.font('Helvetica').fontSize(7).fillColor(PDF_MUTED);
  doc.text(
    'National Eye Hospital — OPD Queue Management System · Monthly summary · Confidential',
    left,
    doc.y,
    { width: w, align: 'center' }
  );
}

function findWeekInSummary(summary, weekStart) {
  if (!summary.weekByWeek?.length || !weekStart) return null;
  const key = String(weekStart).trim();
  const dayKey = key.length >= 10 ? key.slice(0, 10) : key;
  return (
    summary.weekByWeek.find((w) => {
      const ws = String(w.start);
      return ws === key || ws.startsWith(dayKey) || ws.slice(0, 10) === dayKey;
    }) || null
  );
}

function buildPatientDetailsSingleWeekPdf(doc, summary, week) {
  drawPatientDetailsPdfHeader(doc, { compact: false });
  const left = 50;
  const w = doc.page.width - 100;
  doc.font('Helvetica').fontSize(8).fillColor(PDF_MUTED);
  doc.text(
    `Reference: ${fmtDatePdf(summary.referenceDate)}  ·  Generated ${new Date().toLocaleString('en-GB', { timeZone: TZ })} (Asia/Colombo)`,
    left,
    doc.y,
    { width: w, align: 'center' }
  );
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_BRAND).text('Week-by-week patient report', left, doc.y, {
    width: w,
    align: 'center',
  });
  doc.moveDown(0.35);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_BRAND).text(week.label, left, doc.y, { width: w, align: 'center' });
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED).text(
    `${week.uniquePatientCount} unique patients · ${week.appointmentCount} appointments (Mon–Sun, Colombo)`,
    left,
    doc.y,
    { width: w, align: 'center' }
  );
  doc.moveDown(0.9);

  drawPatientWeekTable(doc, summary, week);

  ensurePdfSpace(doc, 36);
  doc.font('Helvetica').fontSize(7).fillColor(PDF_MUTED);
  doc.text(
    'National Eye Hospital — OPD Queue Management System · Single-week extract · Confidential',
    left,
    doc.y,
    { width: w, align: 'center' }
  );
}

export async function getPatientDetailsSummary(req, res) {
  try {
    const { referenceDate } = req.query;
    const summary = await buildPatientDetailsSummary({ referenceDate });
    res.json({ success: true, summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Summary failed' });
  }
}

export async function getPatientDetailsSummaryPdf(req, res) {
  try {
    const { referenceDate, weekStart } = req.query;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');

    if (weekStart) {
      const summary = await buildPatientDetailsSummary({ referenceDate });
      const week = findWeekInSummary(summary, weekStart);
      if (!week) {
        return res.status(400).json({
          success: false,
          message: 'weekStart does not match any week in this report window',
        });
      }
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="neh-week-${formatYMD(new Date(week.start))}-patients.pdf"`
      );
      doc.pipe(res);
      buildPatientDetailsSingleWeekPdf(doc, summary, week);
    } else {
      const monthly = await buildPatientDetailsMonthlyForPdf({ referenceDate });
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="neh-monthly-patient-report-${formatYMD(new Date())}.pdf"`
      );
      doc.pipe(res);
      buildPatientDetailsMonthlyFullPdf(doc, monthly);
    }
    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: e.message || 'PDF failed' });
    }
  }
}

export async function getReportPdf(req, res) {
  try {
    const { granularity = 'week', referenceDate, doctorId } = req.query;
    if (!['week', 'month'].includes(granularity)) {
      return res.status(400).json({ success: false, message: 'granularity must be week or month' });
    }
    const report = await buildAppointmentReport({ granularity, referenceDate, doctorId });
    const doctor = mongoose.Types.ObjectId.isValid(doctorId)
      ? await Doctor.findById(doctorId).select('fullName').lean()
      : null;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qms-appointments-${granularity}-${formatYMD(new Date())}.pdf"`
    );
    doc.pipe(res);

    const left = 50;
    const w = doc.page.width - 100;
    doc.save();
    doc.roundedRect(left, doc.y - 4, w, 60, 6).fill(PDF_PANEL);
    doc.restore();
    drawEyeLogoPdf(doc, left, doc.y, 36);
    doc.font('Helvetica-Bold').fontSize(15).fillColor(PDF_BRAND);
    doc.text('National Eye Hospital', left + 52, doc.y + 6, { width: w - 60 });
    doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED);
    doc.text('Sri Lanka · OPD Queue Management', left + 52, doc.y + 24, { width: w - 60 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_BRAND);
    doc.text('Appointment volume report', left, doc.y + 44, { width: w, align: 'center' });
    doc.y += 68;

    doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED);
    doc.text(`Period mode: ${granularity === 'week' ? 'Week-wise (4 weeks)' : 'Month-wise (6 months)'}`, left, doc.y, {
      width: w,
      align: 'left',
    });
    if (doctor?.fullName) {
      doc.text(`Doctor: ${doctor.fullName}`, { width: w, align: 'left' });
    }
    doc.text(`Generated: ${new Date().toLocaleString('en-GB', { timeZone: TZ })} (Asia/Colombo)`, {
      width: w,
      align: 'left',
    });
    doc.moveDown(0.8);

    const lastBucket = report.buckets[report.buckets.length - 1];
    const kpiY = doc.y;
    const gap = 8;
    const colW = (w - gap * 2) / 3;
    const cards = [
      {
        title: 'Total appointments (latest)',
        value: lastBucket?.appointmentCount ?? 0,
        label: lastBucket?.label ?? '—',
      },
      {
        title: 'Predicted appointments (next)',
        value: report.prediction.nextPeriodAppointments,
        label: `${report.prediction.appointmentRange.min}-${report.prediction.appointmentRange.max}`,
      },
      {
        title: 'Predicted unique patients',
        value: report.prediction.nextPeriodUniquePatients,
        label: `${report.prediction.uniquePatientRange.min}-${report.prediction.uniquePatientRange.max}`,
      },
    ];
    cards.forEach((card, i) => {
      const x = left + i * (colW + gap);
      doc.save();
      doc.roundedRect(x, kpiY, colW, 58, 4).fill(PDF_PANEL);
      doc.roundedRect(x, kpiY, colW, 58, 3).stroke('#e2e8f0');
      doc.fillColor(PDF_BRAND).font('Helvetica-Bold').fontSize(8).text(card.title, x + 8, kpiY + 6, {
        width: colW - 16,
      });
      doc.font('Helvetica-Bold').fontSize(18).fillColor(PDF_BRAND).text(String(card.value), x + 8, kpiY + 24, {
        width: colW - 16,
      });
      doc.font('Helvetica').fontSize(7.5).fillColor(PDF_MUTED).text(card.label, x + 8, kpiY + 44, {
        width: colW - 16,
      });
      doc.restore();
    });
    doc.y = kpiY + 70;

    doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_BRAND);
    doc.text('Weekly buckets', left, doc.y, { width: w });
    doc.moveDown(0.4);

    const tableY = doc.y;
    const colWTable = [w * 0.46, w * 0.18, w * 0.18, w * 0.18];
    const headH = 16;
    doc.roundedRect(left, tableY, w, headH, 3).fill(PDF_BRAND);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    const headers = ['Period', 'Appointments', 'Unique patients', 'Prediction range'];
    let cx = left + 6;
    headers.forEach((h, i) => {
      doc.text(h, cx, tableY + 4, { width: colWTable[i] - 8 });
      cx += colWTable[i];
    });
    let y = tableY + headH;
    report.buckets.forEach((b, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : PDF_PANEL;
      doc.rect(left, y, w, 16).fill(bg).stroke('#e2e8f0');
      doc.fillColor('#111827').font('Helvetica').fontSize(8);
      cx = left + 6;
      const cells = [
        b.label,
        String(b.appointmentCount),
        String(b.uniquePatientCount),
        i === report.buckets.length - 1
          ? `${report.prediction.appointmentRange.min}-${report.prediction.appointmentRange.max}`
          : '—',
      ];
      cells.forEach((cell, j) => {
        doc.text(cell, cx, y + 4, { width: colWTable[j] - 8 });
        cx += colWTable[j];
      });
      y += 16;
    });
    doc.y = y + 8;

    doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED).text('Trend-based forecast (next period)', left, doc.y, {
      width: w,
      align: 'left',
    });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(9).fillColor(PDF_MUTED).text(report.prediction.note, left, doc.y, {
      width: w,
      align: 'left',
    });

    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: e.message || 'PDF failed' });
    }
  }
}
