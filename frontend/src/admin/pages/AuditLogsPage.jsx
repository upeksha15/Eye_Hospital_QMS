import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';

// Admin audit log viewer.
const catColor = {
  system: 'bg-slate-100 text-slate-700',
  user: 'bg-sky-100 text-sky-800',
  doctor: 'bg-emerald-100 text-emerald-800',
  schedule: 'bg-amber-100 text-amber-900',
  security: 'bg-red-100 text-red-800',
  notice: 'bg-violet-100 text-violet-800',
};

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const load = async (p = 1) => {
    const d = await adminApi.getAuditLogs({ page: p, limit });
    setItems(d.items || []);
    setTotal(d.total || 0);
    setPage(d.page || p);
  };

  useEffect(() => {
    load(1).catch(console.error);
  }, []);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="font-admin space-y-8">
      <AdminHeader title="Audit Logs" subtitle="Immutable trail of administrative actions" />

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-admin-navy">Event stream</h2>
          <p className="text-sm text-slate-500">{total} entries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-5 py-3">When</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Actor</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className="border-t border-slate-100 hover:bg-slate-50/40">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        catColor[row.category] || catColor.system
                      }`}
                    >
                      {row.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{row.action}</td>
                  <td className="px-3 py-3 text-slate-600 max-w-md">{row.description}</td>
                  <td className="px-3 py-3 text-slate-500">{row.actorName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
            onClick={() => load(page - 1)}
          >
            Previous
          </button>
          <span className="text-slate-600">
            Page {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
            onClick={() => load(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
