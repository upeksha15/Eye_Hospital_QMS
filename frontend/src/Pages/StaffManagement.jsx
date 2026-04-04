import React, { useEffect, useMemo, useState } from "react";
import StaffSidebar from '../components/StaffSidebar';
import StaffTopBar from "../components/StaffTopBar";
import { fetchAvailableMedicalStaffPanel } from '../api/staffApi';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await fetchAvailableMedicalStaffPanel();
        if (!mounted) return;
        setStaffList(data.staff || []);
      } catch (e) {
        if (!mounted) return;
        setStaffList([]);
        setErr(e.response?.data?.message || e.message || 'Failed to load staff');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const cardInitials = (name) =>
    String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');

  const roleLabel = useMemo(() => ({
    medical_staff: 'Medical staff',
    admin: 'Admin',
  }), []);

  const visibleStaff = useMemo(
    () => staffList.filter((s) => s?.role === 'medical_staff' && s?.isActive !== false),
    [staffList]
  );

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <StaffTopBar />
      <div className="flex">
        <StaffSidebar />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-[#1E3A8A] mb-2 font-['Playfair_Display']">
            Staff Profiles
          </h1>
          <div className="mb-8" />

          {err && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-gray-500 md:col-span-2">
                Loading staff directory…
              </div>
            ) : visibleStaff.map((staff) => (
              <div
                key={staff._id}
                className="bg-white rounded-2xl shadow-lg p-6 flex gap-5 items-start hover:shadow-xl transition-all"
              >
                <div className="w-24 h-24 rounded-full border-2 border-blue-100 shadow-sm overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-extrabold shrink-0">
                  {staff.profileImage ? (
                    <img
                      src={staff.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    cardInitials(staff.fullName) || 'S'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-800">{staff.fullName}</h2>
                  <p className="text-blue-600 font-medium mb-2">{roleLabel[staff.role] || staff.role}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong className="text-gray-700">Email:</strong> {staff.email}
                    </p>
                    <p>
                      <strong className="text-gray-700">Phone:</strong> {staff.contactNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="mt-3">
                    {staff.isOnline ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-400 text-white">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && visibleStaff.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg">No active medical staff found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
