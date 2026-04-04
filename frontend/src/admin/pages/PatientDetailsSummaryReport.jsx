import React from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';
import PatientDetailsSummaryPanel from '../../components/PatientDetailsSummaryPanel';

export default function PatientDetailsSummaryReport() {
  return (
    <div className="font-admin space-y-6">
      <AdminHeader title="Patient details summary report" />
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/40 to-white p-5 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04] sm:p-7 lg:p-8">
        <PatientDetailsSummaryPanel api={adminApi} variant="admin" />
      </div>
    </div>
  );
}
