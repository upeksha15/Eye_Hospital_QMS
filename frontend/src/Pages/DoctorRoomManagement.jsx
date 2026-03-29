import React, { useEffect, useState } from "react";
import axios from "axios";
import StaffSidebar from '../components/StaffSidebar';
import StaffTopBar from "../components/StaffTopBar";

export default function DoctorRoomManagement() {
  const [form, setForm] = useState({
    doctorName: "",
    room: "",
    slotLimit: "",
    queueLimit: "",
  });

  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);

  const API_URL = "http://localhost:5000/api/doctor-rooms";

  const fetchDoctorRooms = async () => {
    try {
      const res = await axios.get(API_URL);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching doctor rooms:", error);
    }
  };

  useEffect(() => {
    fetchDoctorRooms();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.doctorName || !form.room || !form.slotLimit || !form.queueLimit) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, form);
        alert("Updated successfully");
        setEditId(null);
      } else {
        await axios.post(API_URL, form);
        alert("Added successfully");
      }

      setForm({
        doctorName: "",
        room: "",
        slotLimit: "",
        queueLimit: "",
      });

      fetchDoctorRooms();
    } catch (error) {
      console.error("Error saving doctor room:", error);
      alert("Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
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
      slotLimit: item.slotLimit,
      queueLimit: item.queueLimit,
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slot Limit (max patients per day)
                </label>
                <input
                  type="number"
                  name="slotLimit"
                  placeholder="e.g., 20"
                  value={form.slotLimit}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
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
                    <th className="p-3">Slot Limit</th>
                    <th className="p-3">Queue Limit</th>
                    <th className="p-3 text-center">Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-8 text-gray-500">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{item.doctorName}</td>
                        <td className="p-3 text-gray-600">{item.room}</td>
                        <td className="p-3 text-gray-600">{item.slotLimit}</td>
                        <td className="p-3 text-gray-600">{item.queueLimit}</td>
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