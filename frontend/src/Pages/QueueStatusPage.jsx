import React from 'react';
import { Link } from 'react-router-dom';

export default function QueueStatusPage() {
  return (
    <div className="min-h-full bg-gray-50 font-['Nunito']">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-['Playfair_Display'] text-3xl text-[#1E3A8A]">Queue status</h1>
        <p className="mt-3 text-slate-600">
          Live queue boards for each consultant will appear here. For now, book an appointment and
          check in on the day to receive your token.
        </p>
        <Link
          to="/appointments/book"
          className="inline-block mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md"
        >
          Go to booking
        </Link>
      </div>
    </div>
  );
}
