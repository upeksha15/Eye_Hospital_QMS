import React from 'react';
import { useQueue } from '../context/QueueContext';

const WaitingQueue = () => {
  const { waitingQueue } = useQueue();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 transition-transform p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Waiting Room</h3>
            <p className="text-xs text-slate-500 font-medium">Patients in queue</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full border border-blue-400/30 shadow-md">
          <span className="text-sm font-bold text-white">{waitingQueue.length}</span>
        </div>
      </div>
      
      <ul className="list-none max-h-[65vh] overflow-y-auto p-0 m-0 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {waitingQueue.length === 0 ? (
          <li className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No patients in queue</p>
            <p className="text-sm text-gray-400 mt-1">Patients will appear here when they join</p>
          </li>
        ) : (
          waitingQueue.map((p, index) => (
            <li key={p._id || p.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-blue-50/50 border border-slate-200/60 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-200/30 hover:border-blue-300 border-l-4 border-l-blue-500 group">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white font-bold text-sm shadow-sm">
                  #{index + 1}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-lg shadow-md">{p.token}</span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{p.name}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-semibold">Check-In</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Joined Online
                  </div>
                </div>
              </div>
              <div className="text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default WaitingQueue;