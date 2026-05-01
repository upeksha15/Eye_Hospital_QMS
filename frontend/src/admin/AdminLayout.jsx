import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

// Admin workspace shell with sidebar and routed content area.
export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-admin-panel font-admin">
      <AdminSidebar />
      <main className="flex-1 min-h-screen overflow-auto p-6 md:p-8 lg:p-10">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
