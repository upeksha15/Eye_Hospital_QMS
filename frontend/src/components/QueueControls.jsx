import React from 'react';
import { useQueue } from '../context/QueueContext';

const QueueControls = ({ doctorId }) => {
  const { 
    currentToken, 
    timer, 
    pauseQueue,
    resumeQueue,
    enableDoctor,
    disableDoctor,
    callNext, 
    skipToken, 
    doctorStatuses,
  } = useQueue();

  const status = doctorId ? (doctorStatuses || {})[doctorId] : 'Disabled';
  // keep the serving panel visible for Enabled or Paused, only hide when Disabled
  const localActive = String(status) === 'Enabled' || String(status) === 'Paused';

  if (!localActive) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 transition-transform p-8 text-center h-fit">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Queue System Disabled</h3>
        <p className="text-gray-600 mb-8 text-sm">
          Patients cannot join the queue until the system is enabled.
        </p>
        <button 
          className="w-full px-6 py-4 bg-blue-600 text-white font-bold text-base rounded-xl shadow-xl border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 hover:shadow-2xl hover:border-white/30 transition-all duration-200 hover:-translate-y-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2" 
          onClick={async () => {
            try {
              await enableDoctor(doctorId);
            } catch (err) {
              console.error('Enable queue failed', err);
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Enable Queue System
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-xl border-2 border-primary/30">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Session Control</h3>
              <p className="text-sm text-slate-600 font-semibold">Manage queue operations</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              className="px-6 py-3 bg-red-600 border-[3px] border-red-700 text-white rounded-xl text-base font-black transition-all hover:bg-red-700 hover:border-red-800 hover:shadow-xl active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
              onClick={async () => {
                try {
                  await disableDoctor(doctorId);
                } catch (err) {
                  console.error('Disable queue failed', err);
                }
              }}
            >
              Stop Queue
            </button>
            <div>
                {(() => {
                const isPaused = String(status || '').toLowerCase() === 'paused';
                return (
                  <button
                    title={isPaused ? 'Resume' : 'Pause'}
                    onClick={async () => {
                      try {
                        if (doctorId) {
                          if (isPaused) {
                            await resumeQueue(doctorId);
                          } else {
                            await pauseQueue(doctorId);
                          }
                        }
                      } catch (err) {
                        console.error('Toggle pause/resume failed', err);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${isPaused ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                  >
                    {isPaused ? (
                      <>
                        <span className="text-2xl">▶</span>
                        <span className="ml-2 font-semibold">Resume</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">⏸</span>
                        <span className="ml-2 font-semibold">Pause</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Token Display */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 rounded-lg mb-4 text-center shadow-md border border-white/10">
          <div className="text-sm uppercase mb-2 font-semibold text-white/90">Currently Serving</div>
          <div className="text-5xl font-extrabold mb-2">{currentToken ? currentToken.token : '--'}</div>
          <div className="text-lg text-white/90">{timer}</div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <button 
            className={`col-span-2 md:col-span-1 px-6 py-4 text-white font-bold text-base rounded-xl shadow-lg border-2 hover:shadow-2xl hover:border-white/30 transition-all duration-200 hover:-translate-y-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${
              currentToken 
                ? 'bg-purple-600 border-purple-700 hover:bg-purple-700' 
                : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700'
            }`}
            onClick={() => callNext(doctorId)}
          >
            {currentToken ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete & Next
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Call Next Patient
              </>
            )}
          </button>
          <button 
            className="col-span-2 md:col-span-1 px-6 py-4 bg-amber-600 text-white font-bold text-base rounded-xl shadow-lg border-2 border-amber-700 hover:bg-amber-700 hover:border-amber-800 hover:shadow-2xl hover:border-white/30 transition-all duration-200 hover:-translate-y-1 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2" 
            onClick={() => skipToken(doctorId)}
            disabled={!currentToken}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Skip Patient
          </button>
        </div>
      </div>

      {/* Dev Tool / Simulate */}
      <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 shadow-sm p-4">
        <p className="text-xs text-slate-600 font-medium text-center">
          Patients join the queue by checking in from their account.
        </p>
      </div>
    </div>
  );
};

export default QueueControls;