import React from 'react';
import { useQueue } from '../context/QueueContext';

const RecallQueue = () => {
  const { recallQueue, cancelToken } = useQueue();
  const now = Date.now();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 transition-transform p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Recall / Priority</h3>
            <p className="text-xs text-slate-500 font-medium">Skipped patients</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full border border-amber-400/30 shadow-md">
          <span className="text-sm font-bold text-white">{recallQueue.length}</span>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-lg shadow-sm">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800 font-bold">
            Skipped patients have <span className="font-extrabold">10 minutes</span> to return before their token expires.
          </p>
        </div>
      </div>

      <ul className="list-none max-h-[60vh] overflow-y-auto p-0 m-0 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {recallQueue.length === 0 ? (
          <li className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">All patients seen</p>
            <p className="text-sm text-gray-400 mt-1">No skipped patients in recall queue</p>
          </li>
        ) : (
          recallQueue.map(p => {
            const elapsed = (now - p.skippedAt) / 1000;
            const remainingSecs = 600 - elapsed;
            const minsLeft = Math.ceil(remainingSecs / 60);
            const isExpired = remainingSecs < 0;

            return (
              <li key={p.id} className={`flex justify-between items-center p-4 bg-gradient-to-r rounded-xl transition-all hover:-translate-y-1 hover:shadow-md border ${
                isExpired 
                  ? 'from-red-50 to-red-100/50 border-red-200 border-l-4 border-l-red-500' 
                  : 'from-amber-50 to-amber-100/50 border-amber-200 border-l-4 border-l-amber-500'
              }`}>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-3 py-1 rounded-lg font-bold text-lg shadow-sm ${
                      isExpired 
                        ? 'bg-red-200 text-red-800' 
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                      {p.token}
                    </span>
                    {!isExpired && (
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-md text-xs font-bold">
                        {minsLeft} min left
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded-md text-xs font-bold">
                        EXPIRED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Skipped at {new Date(p.skippedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <button 
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold border-2 border-red-700 transition-all hover:bg-red-700 hover:border-red-800 hover:shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-md inline-flex items-center gap-1.5" 
                  onClick={() => cancelToken(p.id)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default RecallQueue;