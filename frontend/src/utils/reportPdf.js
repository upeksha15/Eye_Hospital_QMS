import jsPDF from 'jspdf';
import eyeIcon from '../assets/Eye.png';

const JsPDF =
  typeof jsPDF === 'function' ? jsPDF : jsPDF?.default || jsPDF?.jsPDF;

const FLAG_URL = 'https://flagcdn.com/w80/lk.png';

function loadImageDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

export async function drawReportHeader(doc, startY = 12) {
  let y = startY;
  const pageW = doc.internal.pageSize.getWidth();

  try {
    const eyeData = await loadImageDataUrl(eyeIcon);
    doc.addImage(eyeData, 'PNG', 14, y, 6, 6);
  } catch {
    doc.setFillColor(37, 99, 235);
    doc.circle(17, y + 3, 3, 'F');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 74, 153);
  const title = 'Sri Lanka National Eye Hospital Colombo';
  doc.text(title, 22, y + 4.5);

  try {
    const flagData = await loadImageDataUrl(FLAG_URL);
    doc.addImage(flagData, 'PNG', pageW - 36, y, 22, 11);
  } catch {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Sri Lanka', pageW - 28, y + 6);
  }

  y += 10;
  doc.setDrawColor(45, 157, 120);
  doc.setLineWidth(0.35);
  doc.line(14, y, pageW - 14, y);
  doc.setTextColor(0, 0, 0);
  return y + 6;
}

function fmtGeneratedDate(d = new Date()) {
  return d.toLocaleString('en-LK', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export async function downloadDoctorDetailsPdf(doctorRow) {
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawReportHeader(doc, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Doctor details report', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = [
    ['Doctor name', doctorRow.doctorName || '—'],
    ['Speciality', doctorRow.speciality || '—'],
    ['Available days', doctorRow.availableDays || '—'],
    ['Room number', doctorRow.room || '—'],
    ['Current available slot count', String(doctorRow.remainingSlots ?? '—')],
    ['Generated date', fmtGeneratedDate()],
  ];

  lines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(String(value), 120);
    doc.text(wrapped, 65, y);
    y += Math.max(6, wrapped.length * 5);
  });

  doc.save(`doctor-report-${(doctorRow.doctorName || 'doctor').replace(/\s+/g, '-')}.pdf`);
}

/**
 * Single PDF table: Doctor, Speciality, Available days, Room, Slots left today
 */
export async function downloadDoctorsTablePdf({ rows, filterNote }) {
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawReportHeader(doc, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Doctor details report', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  if (filterNote) {
    doc.text(filterNote, 14, y);
    y += 4;
  }
  doc.text(`Total doctors: ${rows.length}`, 14, y);
  y += 6;
  doc.setTextColor(0, 0, 0);

  const cols = [
    { w: 38, title: 'Doctor' },
    { w: 34, title: 'Speciality' },
    { w: 44, title: 'Available days' },
    { w: 16, title: 'Room' },
    { w: 22, title: 'Slots today' },
  ];

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let x = 14;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  cols.forEach((c) => {
    doc.text(c.title, x + 0.5, y);
    x += c.w;
  });
  y += 3.5;
  doc.setLineWidth(0.2);
  doc.line(14, y, pageW - 14, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  rows.forEach((row) => {
    const cells = [
      row.doctorName || '—',
      row.speciality || '—',
      row.availableDays || '—',
      String(row.room ?? '—'),
      row.slots != null && row.slots !== '' ? String(row.slots) : '—',
    ];

    const lineCounts = cells.map((text, i) => {
      const lines = doc.splitTextToSize(String(text), cols[i].w - 1.5);
      return Math.max(lines.length, 1);
    });
    const rowLines = Math.max(...lineCounts);
    const rowH = rowLines * 3.2 + 2;

    if (y + rowH > pageH - 18) {
      doc.addPage();
      y = 16;
    }

    x = 14;
    cells.forEach((text, i) => {
      const lines = doc.splitTextToSize(String(text), cols[i].w - 1.5);
      doc.text(lines, x + 0.5, y + 3.2);
      x += cols[i].w;
    });
    y += rowH;
  });

  y += 3;
  if (y > pageH - 16) {
    doc.addPage();
    y = 16;
  }
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generated: ${fmtGeneratedDate()}`, 14, y);

  doc.save('doctor-details-report.pdf');
}

export async function downloadAppointmentMonthPdf({
  monthLabel,
  doctorName,
  speciality,
  room,
  rows,
  completedCount,
  bookedCount,
}) {
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawReportHeader(doc, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Appointment report (month-wise)', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`Month: ${monthLabel}`, 14, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Doctor', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${doctorName || '—'}`, 14, y);
  y += 5;
  doc.text(`Speciality: ${speciality || '—'}`, 14, y);
  y += 5;
  doc.text(`Room: ${room || '—'}`, 14, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Appointments', 14, y);
  y += 6;

  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const colDate = 14;
  const colStatus = 58;
  const colRoom = 115;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', colDate, y);
  doc.text('Status', colStatus, y);
  doc.text('Room', colRoom, y);
  y += 5;
  doc.setLineWidth(0.2);
  doc.line(14, y, pageW - 14, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  rows.forEach((r) => {
    if (y > pageH - 28) {
      doc.addPage();
      y = 20;
    }
    const dateLines = doc.splitTextToSize(r.dateStr, 40);
    const statusLines = doc.splitTextToSize(r.statusLabel, 50);
    const rowH = Math.max(dateLines.length, statusLines.length, 1) * 4.5 + 2;
    doc.text(dateLines, colDate, y);
    doc.text(statusLines, colStatus, y);
    doc.text(String(r.room || '—'), colRoom, y);
    y += rowH;
  });

  y += 4;
  if (y > pageH - 30) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total completed (checked-in): ${completedCount}`, 14, y);
  y += 6;
  doc.text(`Total booked (not checked-in): ${bookedCount}`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated date: ${fmtGeneratedDate()}`, 14, y);

  doc.save(`appointments-${monthLabel.replace(/\s+/g, '-')}.pdf`);
}
