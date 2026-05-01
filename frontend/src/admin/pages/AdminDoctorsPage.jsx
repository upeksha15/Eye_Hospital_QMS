import React, { useEffect, useState } from 'react';
import { Stethoscope, Trash2, UserPlus } from 'lucide-react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';

// Admin doctor directory management.
const SPECIALITIES = [
  'General Ophthalmology',
  'Consultant Ophthalmologist',
  'Pediatric Ophthalmologist',
  'Geriatric Ophthalmologist',
  'Retina Specialist',
  'Cornea Specialist',
  'Glaucoma Specialist',
  'Cataract Surgeon',
  'Refractive Surgeon',
  'Oculoplastic Surgeon',
  'Neuro-Ophthalmologist',
  'Uveitis Specialist',
  'Optometrist',
  'Orthoptist',
  'Low Vision Specialist',
  'Vitreoretinal Surgeon',
  'Anterior Segment Surgeon',
  'Ocular Oncology Specialist',
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DOCTOR_PREFIX = 'Dr. ';

function normalizeDoctorName(value, options = {}) {
  const { keepTrailingSpace = false } = options;
  const raw = String(value || '');
  const withoutPrefix = raw.replace(/^dr\.?\s*/i, '');
  const trimmedStart = withoutPrefix.replace(/^\s+/, '');
  const normalized = `${DOCTOR_PREFIX}${trimmedStart}`;
  return keepTrailingSpace ? normalized : normalized.trim();
}

const emptyForm = {
  fullName: DOCTOR_PREFIX,
  speciality: '',
  availability: [],
};

export default function AdminDoctorsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const selectedSpeciality = form.speciality && !SPECIALITIES.includes(form.speciality) ? form.speciality : '';

  const validateForm = () => {
    const nextErrors = {};
    const normalizedName = normalizeDoctorName(form.fullName);
    const nameWithoutPrefix = normalizedName.replace(/^Dr\.\s*/i, '').trim();
    // Validation: required doctor name and no digits.
    if (!nameWithoutPrefix) {
      nextErrors.fullName = 'Doctor name is required.';
    } else if (/\d/.test(nameWithoutPrefix)) {
      nextErrors.fullName = 'Doctor name cannot contain numbers.';
    }
    // Validation: required speciality.
    if (!form.speciality?.trim()) {
      nextErrors.speciality = 'Speciality is required.';
    }
    // Validation: require at least one weekday.
    if (!Array.isArray(form.availability) || form.availability.length === 0) {
      nextErrors.availability = 'Select at least one weekday.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const load = async () => {
    const d = await adminApi.getDoctorsAdmin();
    setList(d.doctors || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    // Validation: block submit until form rules pass.
    if (!validateForm()) {
      setMsg('All fields should be completed before creating a doctor.');
      return;
    }
    try {
      const payload = {
        fullName: normalizeDoctorName(form.fullName),
        speciality: form.speciality.trim(),
        availability: Array.isArray(form.availability) ? form.availability : [],
      };

      if (editingId) {
        await adminApi.updateDoctor(editingId, payload);
        setMsg('Doctor profile updated.');
      } else {
        await adminApi.createDoctor(payload);
        setMsg('Doctor profile created.');
      }

      setEditingId(null);
      setForm(emptyForm);
      setFieldErrors({});
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({
      fullName: normalizeDoctorName(row.fullName || ''),
      speciality: row.speciality || '',
      availability: Array.isArray(row.availability) ? row.availability : [],
    });
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAvailability = (day) => {
    setForm((prev) => {
      const hasDay = prev.availability.includes(day);
      return {
        ...prev,
        availability: hasDay
          ? prev.availability.filter((d) => d !== day)
          : [...prev.availability, day],
      };
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this doctor profile?')) return;
    setMsg('');
    try {
      await adminApi.deleteDoctor(id);
      await load();
      setMsg('Doctor profile deleted.');
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="font-admin space-y-8">
      <AdminHeader
        title="Doctors"
        subtitle="Create and manage doctor profiles for appointments and scheduling"
      />

      {msg && (
        <div className="rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm px-4 py-3">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          onSubmit={submit}
          className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-admin-navy flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-admin-accent" />
            {editingId ? 'Edit doctor profile' : 'Create doctor profile'}
          </h2>

          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Doctor name</span>
            <input
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(e) => {
                setForm({
                  ...form,
                  fullName: normalizeDoctorName(e.target.value, { keepTrailingSpace: true }),
                });
                setFieldErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              onFocus={() => {
                if (!form.fullName.trim()) {
                  setForm({ ...form, fullName: DOCTOR_PREFIX });
                }
              }}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Speciality</span>
            <select
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              value={form.speciality || ''}
              onChange={(e) => {
                setForm({ ...form, speciality: e.target.value });
                setFieldErrors((prev) => ({ ...prev, speciality: '' }));
              }}
            >
              <option value="" disabled>
                Select speciality
              </option>
              {selectedSpeciality && (
                <option value={selectedSpeciality}>{selectedSpeciality} (current)</option>
              )}
              {SPECIALITIES.map((speciality) => (
                <option key={speciality} value={speciality}>
                  {speciality}
                </option>
              ))}
            </select>
            {fieldErrors.speciality && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.speciality}</p>
            )}
          </label>

          <div>
            <span className="text-xs font-semibold text-slate-500">Availability (select weekdays)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const checked = form.availability.includes(day);
                return (
                  <label
                    key={day}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      checked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={checked}
                      onChange={() => toggleAvailability(day)}
                    />
                    {day}
                  </label>
                );
              })}
            </div>
            {fieldErrors.availability && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.availability}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-semibold shadow"
            >
              {editingId ? 'Save changes' : 'Create doctor'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                  setFieldErrors({});
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-admin-navy">Doctor directory</h2>
            <p className="text-sm text-slate-500 mt-1">Profiles used by appointment and queue modules.</p>
          </div>
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-3 py-3">Speciality</th>
                  <th className="px-3 py-3">Availability</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">{d.fullName}</td>
                    <td className="px-3 py-3 text-slate-600">{d.speciality}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {Array.isArray(d.availability) && d.availability.length > 0
                        ? d.availability.join(', ')
                        : 'Not set'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 items-center">
                        <button
                          type="button"
                          className="text-xs font-semibold text-admin-accent hover:underline"
                          onClick={() => edit(d)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-red-50"
                          onClick={() => remove(d._id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      No doctors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 flex items-start gap-2">
        <Stethoscope className="w-5 h-5 mt-0.5" />
        Doctor profiles created here are available in booking, reporting, and queue workflows.
      </div>
    </div>
  );
}
