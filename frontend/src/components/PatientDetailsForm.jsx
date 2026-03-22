import React from 'react';

const REASONS = [
  { value: 'new_consultation', label: 'New consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'post_surgery_review', label: 'Post-surgery review' },
  { value: 'prescription_renewal', label: 'Prescription renewal' },
];

export default function PatientDetailsForm({
  strings,
  values,
  onChange,
  disabledProfile,
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-['Playfair_Display'] text-xl text-[#1E3A8A] font-semibold">
        {strings.patientDetails}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">{strings.fullName}</label>
          <input
            name="fullName"
            value={values.fullName}
            onChange={onChange}
            disabled={disabledProfile}
            className="w-full rounded-[10px] border-2 border-blue-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">{strings.nic}</label>
          <input
            name="nic"
            value={values.nic}
            onChange={onChange}
            disabled={disabledProfile}
            className="w-full rounded-[10px] border-2 border-blue-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">{strings.dob}</label>
          <input
            name="dateOfBirth"
            type="date"
            value={values.dateOfBirth}
            onChange={onChange}
            disabled={disabledProfile}
            className="w-full rounded-[10px] border-2 border-blue-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">{strings.contact}</label>
          <input
            name="contactNumber"
            value={values.contactNumber}
            onChange={onChange}
            disabled={disabledProfile}
            className="w-full rounded-[10px] border-2 border-blue-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">{strings.reason}</label>
        <select
          name="visitReason"
          value={values.visitReason}
          onChange={onChange}
          className="w-full rounded-[10px] border-2 border-blue-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition bg-white"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">{strings.notes}</label>
        <textarea
          name="notes"
          rows={3}
          value={values.notes}
          onChange={onChange}
          placeholder="Optional"
          className="w-full rounded-[10px] border-2 border-blue-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition resize-y min-h-[80px]"
        />
      </div>
    </div>
  );
}
