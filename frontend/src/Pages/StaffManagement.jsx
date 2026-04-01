import React, { useState } from "react";
import StaffSidebar from '../components/StaffSidebar';
import StaffTopBar from "../components/StaffTopBar";

export default function StaffManagement() {
  const [staffList] = useState([
    {
      _id: "s1",
      fullName: "Nimal Perera",
      role: "Receptionist",
      email: "nimal.perera@nehospital.com",
      phone: "+94 77 345 6789",
      availability: "available",
      photo: "https://randomuser.me/api/portraits/men/65.jpg",
    },
    {
      _id: "s2",
      fullName: "Saman Kumara",
      role: "Nurse",
      email: "saman.kumara@nehospital.com",
      phone: "+94 77 456 7890",
      availability: "unavailable",
      photo: "https://randomuser.me/api/portraits/men/33.jpg",
    },
    {
      _id: "s3",
      fullName: "Anusha Fernando",
      role: "Admin Staff",
      email: "anusha.fernando@nehospital.com",
      phone: "+94 77 567 8901",
      availability: "available",
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  ]);

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <StaffTopBar />
      <div className="flex">
        <StaffSidebar />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-[#1E3A8A] mb-8 font-['Playfair_Display']">
            Staff Profiles
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staffList.map((staff) => (
              <div
                key={staff._id}
                className="bg-white rounded-2xl shadow-lg p-6 flex gap-5 items-start hover:shadow-xl transition-all"
              >
                <img
                  src={staff.photo}
                  alt={staff.fullName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-100 shadow-sm"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800">{staff.fullName}</h2>
                  <p className="text-blue-600 font-medium mb-2">{staff.role}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong className="text-gray-700">Email:</strong> {staff.email}
                    </p>
                    <p>
                      <strong className="text-gray-700">Phone:</strong> {staff.phone}
                    </p>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        staff.availability === "available"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {staff.availability === "available" ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {staffList.length === 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-gray-500 text-lg">No staff members found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}