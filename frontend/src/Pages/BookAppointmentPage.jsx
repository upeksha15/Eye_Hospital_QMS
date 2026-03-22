import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import HoursStrip from '../components/HoursStrip';
import NoticeBar from '../components/NoticeBar';
import HeroSection from '../components/HeroSection';
import StepBar from '../components/StepBar';
import DoctorDropdown from '../components/DoctorDropdown';
import AppointmentCalendar from '../components/AppointmentCalendar';
import SlotDetailPanel from '../components/SlotDetailPanel';
import TokenFlowCard from '../components/TokenFlowCard';
import PatientDetailsForm from '../components/PatientDetailsForm';
import BookingSidebar from '../components/BookingSidebar';
import CheckInBanner from '../components/CheckInBanner';
import { bookingStrings } from '../i18n/bookingStrings';
import { useAuth } from '../hooks/useAuth';
import { useSlotAvailability } from '../hooks/useSlotAvailability';
import { useSocket } from '../hooks/useSocket';
import { fetchDoctors } from '../api/doctorsApi';
import { createAppointment } from '../api/appointmentsApi';
import { fetchQueueToday } from '../api/queueApi';
import { monthKeyFromDate, formatYMD, nowColombo } from '../utils/dateHelpers';

const REASON_LABELS = {
  new_consultation: 'New consultation',
  follow_up: 'Follow-up',
  post_surgery_review: 'Post-surgery review',
  prescription_renewal: 'Prescription renewal',
};

function toInputDate(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  return formatYMD(d);
}

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const { patient, isAuthenticated } = useAuth();
  const [lang, setLang] = useState('en');
  const strings = bookingStrings[lang] || bookingStrings.en;

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(nowColombo()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [queueWaiting, setQueueWaiting] = useState(null);

  const [form, setForm] = useState({
    fullName: '',
    nic: '',
    dateOfBirth: '',
    contactNumber: '',
    visitReason: 'new_consultation',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchDoctors();
        setDoctors(data.doctors || []);
      } catch {
        setDoctors([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (patient) {
      setForm((f) => ({
        ...f,
        fullName: patient.fullName || '',
        nic: patient.nic || '',
        dateOfBirth: toInputDate(patient.dateOfBirth),
        contactNumber: patient.contactNumber || '',
      }));
    }
  }, [patient]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d._id === doctorId) || null,
    [doctors, doctorId]
  );

  const { slots, loading: slotsLoading } = useSlotAvailability(doctorId, monthKey);

  useEffect(() => {
    setSelectedDate(null);
  }, [doctorId]);

  const loadQueue = useCallback(async () => {
    if (!doctorId) {
      setQueueWaiting(null);
      return;
    }
    try {
      const data = await fetchQueueToday(doctorId);
      setQueueWaiting(data.waiting ?? null);
    } catch {
      setQueueWaiting(null);
    }
  }, [doctorId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onQueueSocket = useCallback(() => {
    loadQueue();
  }, [loadQueue]);

  useSocket(doctorId, onQueueSocket);

  const slotForDay = useMemo(() => {
    if (!selectedDate) return null;
    return slots.find((s) => s.date === selectedDate) || null;
  }, [slots, selectedDate]);

  const handleDoctorChange = (id) => {
    setDoctorId(id);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setSelectedDate(null);
    setFormError('');
    if (patient) {
      setForm((f) => ({
        ...f,
        visitReason: 'new_consultation',
        notes: '',
      }));
    }
  };

  const handleConfirm = async () => {
    setFormError('');
    if (!isAuthenticated) {
      setFormError('Please log in or register to book an appointment.');
      navigate('/register');
      return;
    }
    if (!doctorId || !selectedDate) {
      setFormError('Select a consultant and an available date.');
      return;
    }
    if (!slotForDay || slotForDay.available <= 0) {
      setFormError('No slots left for this date.');
      return;
    }

    setSubmitting(true);
    try {
      const appointmentDate = new Date(`${selectedDate}T00:00:00+05:30`).toISOString();
      await createAppointment({
        doctorId,
        appointmentDate,
        visitReason: form.visitReason,
        notes: form.notes,
      });
      navigate('/appointments/mine', { replace: true });
    } catch (e) {
      setFormError(e.response?.data?.message || e.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito'] text-slate-800">
      <TopBar lang={lang} onLangChange={setLang} strings={strings} />
      <Navbar strings={strings} patient={patient} />
      <HoursStrip strings={strings} />
      <NoticeBar />
      <HeroSection strings={strings} consultantCount={doctors.length} />
      <StepBar strings={strings} />

      <main className="max-w-7xl mx-auto px-4 pb-16">
        <CheckInBanner />

        <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-start">
          <div className="space-y-8">
            <section className="rounded-[18px] bg-white border border-blue-100 shadow-[0_4px_24px_rgba(37,99,235,0.10)] p-6 sm:p-8 space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm shadow">
                  1
                </div>
                <DoctorDropdown
                  doctors={doctors}
                  value={doctorId}
                  onChange={handleDoctorChange}
                  strings={strings}
                />
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm shadow">
                  2
                </div>
                <AppointmentCalendar
                  monthKey={monthKey}
                  onMonthChange={setMonthKey}
                  slots={slots}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  loading={slotsLoading}
                  strings={strings}
                />
                <SlotDetailPanel
                  dateStr={selectedDate}
                  slot={slotForDay}
                  lang={lang}
                  strings={strings}
                />
                <TokenFlowCard strings={strings} />
              </div>

              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm shadow">
                  3
                </div>
                <PatientDetailsForm
                  strings={strings}
                  values={form}
                  onChange={handleFormChange}
                  disabledProfile={Boolean(patient)}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="rounded-[14px] bg-gradient-to-r from-blue-50 to-blue-100/80 border border-blue-100 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-slate-700">{strings.ctaNote}</p>
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl border-2 border-blue-300 text-blue-800 font-semibold text-sm hover:bg-white transition"
                  >
                    {strings.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirm}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition disabled:opacity-60"
                  >
                    {strings.confirm} →
                  </button>
                </div>
              </div>
            </section>
          </div>

          <BookingSidebar
            strings={strings}
            lang={lang}
            doctor={selectedDoctor}
            selectedDate={selectedDate}
            slot={slotForDay}
            patientName={form.fullName}
            visitReasonLabel={REASON_LABELS[form.visitReason]}
            queueWaiting={queueWaiting}
          />
        </div>
      </main>
    </div>
  );
}
