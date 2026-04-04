import React, { useEffect, useState } from "react";
import api from '../api/client';
import StaffSidebar from '../components/StaffSidebar';
import StaffTopBar from "../components/StaffTopBar";

export default function DoctorRoomManagement() {
  const [form, setForm] = useState({
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
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    fetchDoctorRooms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleWeekdayToggle = (day) => {
    setForm((prev) => {
      const has = prev.availability.includes(day);
      return {
        ...prev,
        availability: has ? prev.availability.filter((d) => d !== day) : [...prev.availability, day],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorName || !form.room || !form.queueLimit) {
      alert('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        const payload = { ...form };
        if (payload.specialization === 'Other') payload.specialization = payload.otherSpecialization || '';
        payload.availability = Array.isArray(payload.availability) ? payload.availability : [];
        payload.queueLimit = Number(payload.queueLimit);
        payload.specialization = (payload.specialization || '').trim();
        await api.put(`${API_URL}/${editId}`, payload);
        alert('Updated successfully');
        setEditId(null);
      } else {
        const payload = { ...form };
        if (payload.specialization === 'Other') payload.specialization = payload.otherSpecialization || '';
        payload.availability = Array.isArray(payload.availability) ? payload.availability : [];
        payload.queueLimit = Number(payload.queueLimit);
        payload.specialization = (payload.specialization || '').trim();
        await api.post(API_URL, payload);
        alert('Added successfully');
      }

      setForm({
        doctorName: '',
        room: '',
        queueLimit: '',
        specialization: 'General Ophthalmology',
        otherSpecialization: '',
        availability: [],
      });

      fetchDoctorRooms();
    } catch (error) {
      console.error('Error saving doctor room:', error);
      alert('Something went wrong');
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
    setForm({
      doctorName: item.doctorName,
      room: item.room,
      queueLimit: item.queueLimit,
      specialization: PRESET_SPECIALIZATIONS.includes(item.specialization) ? item.specialization : (item.specialization ? 'Other' : 'General Ophthalmology'),
      otherSpecialization: item.specialization && !PRESET_SPECIALIZATIONS.includes(item.specialization) ? item.specialization : '',
      availability: Array.isArray(item.availability) ? item.availability : [],
    });
    setEditId(item._id);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  name="doctorName"
                  placeholder="Enter doctor name"
                  value={form.doctorName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* slotLimit removed per UI request - server will use default */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 bg-white"
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
                  <input
                    type="text"
                    name="otherSpecialization"
                    placeholder="Enter specialization"
                    value={form.otherSpecialization}
                    onChange={handleChange}
                    className="mt-2 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability (select weekdays)</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => (
                    <label key={d} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${form.availability.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'}`}>
                      <input type="checkbox" checked={form.availability.includes(d)} onChange={() => handleWeekdayToggle(d)} />
                      <span className="text-sm">{d}</span>
                    </label>
                  ))}
                </div>
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