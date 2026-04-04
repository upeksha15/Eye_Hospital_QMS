import React from 'react';
import StaffTopBar from '../components/StaffTopBar';
import StaffSidebar from '../components/StaffSidebar';
import PatientDetailsSummaryPanel from '../components/PatientDetailsSummaryPanel';
import * as staffApi from '../api/staffApi';

export default function StaffPatientDetailsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-[#e4edf5] to-slate-100 font-['Nunito'] grid grid-rows-[82px_1fr] text-slate-900 antialiased">
      <StaffTopBar />
      <div className="flex overflow-hidden min-h-0">
        <StaffSidebar />
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
            <article className="overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)] backdrop-blur-sm ring-1 ring-slate-200/60">
              <header className="bg-gradient-to-r from-[#001f3f] via-[#0a3a5c] to-[#001f3f] px-5 py-4 sm:px-6 sm:py-5">
                <h1 className="font-['Playfair_Display'] text-lg font-semibold tracking-tight text-white sm:text-xl">
                  Patient details summary
                </h1>
                <p className="mt-1 text-xs font-medium text-teal-100/90">National Eye Hospital · OPD</p>
              </header>
              <div className="bg-gradient-to-b from-slate-50/80 to-white p-5 sm:p-7 lg:p-8">
                <PatientDetailsSummaryPanel api={staffApi} variant="staff" />
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
}
