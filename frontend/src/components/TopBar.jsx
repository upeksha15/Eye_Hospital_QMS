import React from 'react';
import { Mail, Phone } from 'lucide-react';

export default function TopBar({ lang, onLangChange, strings }) {
  return (
    <div className="bg-[#1E3A8A] text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-6">
          <a className="flex items-center gap-2 hover:opacity-90" href={`tel:${strings.phone.replace(/\s/g, '')}`}>
            <Phone className="w-4 h-4" />
            {strings.phone}
          </a>
          <a className="flex items-center gap-2 hover:opacity-90" href={`mailto:${strings.email}`}>
            <Mail className="w-4 h-4" />
            {strings.email}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-200/90 hidden sm:inline">Language:</span>
          {['en', 'si', 'ta'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onLangChange(code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                lang === code
                  ? 'bg-white text-[#1E3A8A] shadow'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {code === 'en' ? 'English' : code === 'si' ? 'සිංහල' : 'தமிழ்'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
