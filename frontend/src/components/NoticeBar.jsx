import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../api/client';

export default function NoticeBar() {
  const [message, setMessage] = useState(
    'Loading hospital notices…'
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/announcements');
        const first = data.announcements?.[0]?.message;
        if (!cancelled && first) setMessage(first);
      } catch {
        if (!cancelled) {
          setMessage('Welcome to National Eye Hospital OPD online booking.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2 justify-center text-sm shadow-inner">
      <AlertTriangle className="w-5 h-5 shrink-0 opacity-90" aria-hidden />
      <span className="text-center">{message}</span>
    </div>
  );
}
