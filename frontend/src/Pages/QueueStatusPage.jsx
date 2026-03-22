import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import HoursStrip from '../components/HoursStrip';
import NoticeBar from '../components/NoticeBar';
import { bookingStrings } from '../i18n/bookingStrings';
import { useAuth } from '../hooks/useAuth';

export default function QueueStatusPage() {
  const { patient } = useAuth();
  const strings = bookingStrings.en;

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <TopBar lang="en" onLangChange={() => {}} strings={strings} />
      <Navbar strings={strings} patient={patient} />
      <HoursStrip strings={strings} />
      <NoticeBar />
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
