import React, { useEffect, useState } from "react";
import api from '../api/client';
import StaffSidebar from '../components/StaffSidebar';
import StaffTopBar from "../components/StaffTopBar";

export default function DoctorRoomManagement() {
  const [form, setForm] = useState({
    doctorId: "",
    doctorName: "",
    room: "",
    queueLimit: "",
    specialization: "General Ophthalmology",
    otherSpecialization: "",
    availability: [],
  });

  const PRESET_SPECIALIZATIONS = [
    // General Categories
    'General Ophthalmology',
    'Consultant Ophthalmologist',
    'Pediatric Ophthalmologist',
    'Geriatric Ophthalmologist',
    // Sub-specialties
    'Retina Specialist',
    'Cornea Specialist',
    'Glaucoma Specialist',
    'Cataract Surgeon',
    'Refractive Surgeon',
    'Oculoplastic Surgeon',
    'Neuro-Ophthalmologist',
    'Uveitis Specialist',
    // Diagnostic & Support Areas
    'Optometrist',
    'Orthoptist',
    'Low Vision Specialist',
    // Surgical / Advanced Care
    'Vitreoretinal Surgeon',
    'Anterior Segment Surgeon',
    'Ocular Oncology Specialist',
  ];

  const [data, setData] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const API_URL = "/api/doctor-rooms";
  const fetchDoctorRooms = async () => {
    try {
      const res = await api.get(API_URL);
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching doctor rooms:', error);
      setData([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/doctors');
      setDoctors(res.data?.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchDoctorRooms();
    fetchDoctors();
  }, []);

  const applyDoctorSelection = (doctorId) => {
    const selected = doctors.find((d) => d._id === doctorId);
    if (!selected) {
      setEditId(null);
      setForm((prev) => ({
        ...prev,
        doctorId: '',
        doctorName: '',
        room: '',
        queueLimit: '',
        specialization: 'General Ophthalmology',
        otherSpecialization: '',
        availability: [],
      }));
      return;
    }

    const rawSpeciality = (selected.speciality || '').trim();
    const isPreset = PRESET_SPECIALIZATIONS.includes(rawSpeciality);
    const existingRoomConfig = data.find((row) => row.doctorName === (selected.fullName || ''));
    if (existingRoomConfig) {
      setEditId(existingRoomConfig._id);
    } else {
      setEditId(null);
    }
    setForm((prev) => ({
      ...prev,
      doctorId: selected._id,
      doctorName: selected.fullName || '',
      room: existingRoomConfig?.room ?? '',
      queueLimit: existingRoomConfig?.queueLimit ?? '',
      specialization: isPreset ? rawSpeciality : 'Other',
      otherSpecialization: isPreset ? '' : rawSpeciality,
      availability: Array.isArray(selected.availability) ? selected.availability : [],
    }));
    setErrors((prev) => ({ ...prev, doctorName: '', specialization: '', availability: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
    // validate field on change
    setErrors((prev) => ({ ...prev, [name]: '' }));

    // Inline per-field validation
    if (name === 'doctorId') {
      applyDoctorSelection(value);
      return;
    }
    if (name === 'room') {
      // numeric only
      const ok = value === '' || /^\d+$/.test(value);
      if (!ok) setErrors((prev) => ({ ...prev, room: 'Room must contain only numbers' }));
    }
    if (name === 'queueLimit') {
      // positive integer, no zero or negative
      const n = Number(value);
      const ok = value === '' || (Number.isFinite(n) && Number.isInteger(n) && n > 0);
      if (!ok) setErrors((prev) => ({ ...prev, queueLimit: 'Queue limit must be a positive integer' }));
    }
  };

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleWeekdayToggle = (day) => {
    if (form.doctorId) return;
    setForm((prev) => {
      const has = prev.availability.includes(day);
      return {
        ...prev,
        availability: has ? prev.availability.filter((d) => d !== day) : [...prev.availability, day],
      };
    });
    setErrors((prev) => ({ ...prev, availability: '' }));
  };

  const validateForm = (f) => {
    const e = {};
    if (!f.doctorId) e.doctorName = 'Please select a doctor';
    if (!f.room || !String(f.room).trim()) e.room = 'Room is required';
    else if (!/^\d+$/.test(String(f.room))) e.room = 'Room must contain only numbers';
    const q = Number(f.queueLimit);
    if (!Number.isFinite(q) || !Number.isInteger(q) || q <= 0) e.queueLimit = 'Queue limit must be a positive integer';
    if (f.specialization === 'Other' && (!f.otherSpecialization || !f.otherSpecialization.trim())) e.otherSpecialization = 'Please provide specialization';
    if (!Array.isArray(f.availability) || f.availability.length === 0) e.availability = 'No availability days found for selected doctor';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateForm(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      if (editId) {
        const payload = { ...form };
        payload.doctorName = (payload.doctorName || '').trim();
        payload.room = String(payload.room).trim();
        if (payload.specialization === 'Other') payload.specialization = payload.otherSpecialization || '';
        payload.availability = Array.isArray(payload.availability) ? payload.availability : [];
        payload.queueLimit = Number(payload.queueLimit);
        payload.specialization = (payload.specialization || '').trim();
        await api.put(`${API_URL}/${editId}`, payload);
        alert('Updated successfully');
        setEditId(null);
      } else {
        const payload = { ...form };
        payload.doctorName = (payload.doctorName || '').trim();
        payload.room = String(payload.room).trim();
        if (payload.specialization === 'Other') payload.specialization = payload.otherSpecialization || '';
        payload.availability = Array.isArray(payload.availability) ? payload.availability : [];
        payload.queueLimit = Number(payload.queueLimit);
        payload.specialization = (payload.specialization || '').trim();
        await api.post(API_URL, payload);
        alert('Added successfully');
      }

      setForm({
        doctorId: '',
        doctorName: '',
        room: '',
        queueLimit: '',
        specialization: 'General Ophthalmology',
        otherSpecialization: '',
        availability: [],
      });
      setErrors({});
      setSubmitError('');

      fetchDoctorRooms();
    } catch (error) {
      console.error('Error saving doctor room:', error);
      setSubmitError(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm('Delete this doctor room?')) return;
      await api.delete(`${API_URL}/${id}`);
      alert("Deleted successfully");
      fetchDoctorRooms();
    } catch (error) {
      console.error("Error deleting doctor room:", error);
      alert("Delete failed");
    }
  };

  const handleEdit = (item) => {
    const selected = doctors.find((d) => d.fullName === item.doctorName);
    setForm({
      doctorId: selected?._id || '',
      doctorName: item.doctorName,
      room: item.room,
      queueLimit: item.queueLimit,
      specialization: PRESET_SPECIALIZATIONS.includes(item.specialization) ? item.specialization : (item.specialization ? 'Other' : 'General Ophthalmology'),
      otherSpecialization: item.specialization && !PRESET_SPECIALIZATIONS.includes(item.specialization) ? item.specialization : '',
      availability: Array.isArray(item.availability) ? item.availability : [],
    });
    setEditId(item._id);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <StaffTopBar />
      <div className="flex">
        <StaffSidebar />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-[#1E3A8A] mb-8 font-['Playfair_Display']">
            Doctor Room & Queue Management
          </h1>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
              {submitError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Name
                </label>
                <select
                  name="doctorId"
                  value={form.doctorId}
                  onChange={handleChange}
                  className={`w-full rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.doctorName ? 'border-red-500' : 'border border-gray-300'}`}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.fullName}
                    </option>
                  ))}
                </select>
                {errors.doctorName && <div className="text-xs text-red-600 mt-1">{errors.doctorName}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  name="room"
                  placeholder="e.g., 101"
                  value={form.room}
                  onChange={handleChange}
                  className={`w-full rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.room ? 'border-red-500' : 'border border-gray-300'}`}
                />
                {errors.room && <div className="text-xs text-red-600 mt-1">{errors.room}</div>}
              </div>

              {/* slotLimit removed per UI request - server will use default */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  disabled
                  className={`w-full rounded-lg p-2 bg-white ${errors.specialization ? 'border-red-500' : 'border border-gray-300'}`}
                >
                  <optgroup label="General Categories">
                    <option>General Ophthalmology</option>
                    <option>Consultant Ophthalmologist</option>
                    <option>Pediatric Ophthalmologist</option>
                    <option>Geriatric Ophthalmologist</option>
                  </optgroup>
                  <optgroup label="Sub-specialties">
                    <option>Retina Specialist</option>
                    <option>Cornea Specialist</option>
                    <option>Glaucoma Specialist</option>
                    <option>Cataract Surgeon</option>
                    <option>Refractive Surgeon</option>
                    <option>Oculoplastic Surgeon</option>
                    <option>Neuro-Ophthalmologist</option>
                    <option>Uveitis Specialist</option>
                  </optgroup>
                  <optgroup label="Diagnostic & Support Areas">
                    <option>Optometrist</option>
                    <option>Orthoptist</option>
                    <option>Low Vision Specialist</option>
                  </optgroup>
                  <optgroup label="Surgical / Advanced Care">
                    <option>Vitreoretinal Surgeon</option>
                    <option>Anterior Segment Surgeon</option>
                    <option>Ocular Oncology Specialist</option>
                  </optgroup>
                  <option>Other</option>
                </select>
                {form.specialization === 'Other' && (
                  <>
                    <input
                      type="text"
                      name="otherSpecialization"
                      placeholder="Enter specialization"
                      value={form.otherSpecialization}
                      readOnly
                      className={`mt-2 w-full rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.otherSpecialization ? 'border-red-500' : 'border border-gray-300'}`}
                    />
                    {errors.otherSpecialization && <div className="text-xs text-red-600 mt-1">{errors.otherSpecialization}</div>}
                  </>
                )}
              </div>

            

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Queue Limit (max waiting in queue)
                </label>
                <input
                  type="number"
                  name="queueLimit"
                  placeholder="e.g., 10"
                  value={form.queueLimit}
                  onChange={handleChange}
                  className={`w-full rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.queueLimit ? 'border-red-500' : 'border border-gray-300'}`}
                />
                {errors.queueLimit && <div className="text-xs text-red-600 mt-1">{errors.queueLimit}</div>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability (select weekdays)</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => (
                    <label key={d} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${form.availability.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={form.availability.includes(d)}
                        disabled={Boolean(form.doctorId)}
                        onChange={() => handleWeekdayToggle(d)}
                      />
                      <span className="text-sm">{d}</span>
                    </label>
                  ))}
                </div>
                {errors.availability && <div className="text-xs text-red-600 mt-2">{errors.availability}</div>}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                disabled={submitting}
              >
                {editId ? "Update" : "Add"}
              </button>
            </div>
          </form>

          {/* Table Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Room</th>
                    
                    <th className="p-3">Queue Limit</th>
                    <th className="p-3">Availability</th>
                    <th className="p-3 text-center">Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{item.doctorName}</td>
                        <td className="p-3 text-gray-600">{item.room}</td>
                        
                        <td className="p-3 text-gray-600">{item.queueLimit}</td>
                        <td className="p-3 text-gray-600">{(item.availability || []).join(', ')}</td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}