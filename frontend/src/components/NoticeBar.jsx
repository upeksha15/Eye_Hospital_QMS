import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../api/client';

export default function NoticeBar() {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/announcements');
        const active = (data.announcements || []).filter(
          (a) => a && a.isActive !== false && a.message && a.message.trim()
        );

        if (!cancelled && active.length > 0) {
          setMessages(active.map((a) => a.message.trim()));
        } else if (!cancelled) {
          setMessages([]);
        }
      } catch {
        if (!cancelled) setMessages([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-3 justify-center text-sm shadow-inner">
      <AlertTriangle className="w-5 h-5 shrink-0 opacity-90" aria-hidden />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {messages === null && (
          <span>Loading hospital notices…</span>
        )}
        {messages !== null && messages.length === 0 && (
          <span>Welcome to National Eye Hospital OPD online booking.</span>
        )}
        {messages && messages.length > 0 && (
          messages.map((msg, idx) => (
            <span key={idx} className="inline-block whitespace-nowrap">
              {msg}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
