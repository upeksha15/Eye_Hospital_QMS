import React from 'react';
import { Users } from 'lucide-react';

export default function HeroSection({ strings, consultantCount }) {
  return (
	<section className="relative overflow-hidden bg-gradient-to-br from-[#2A9DF4] to-[#0F4C81] text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 w-72 h-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -left-16 bottom-0 w-56 h-56 rounded-full bg-blue-400/10" />

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20 relative">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
          <div className="max-w-2xl">
            <h1 className="mt-4 font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-[2.6rem] leading-tight font-semibold">
              {strings.heroTitle}
            </h1>
            <p className="mt-4 text-blue-100/95 text-sm sm:text-base max-w-xl leading-relaxed">
              {strings.heroSub}
            </p>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[250px]">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{String(consultantCount ?? '—')}</p>
                  <p className="text-xs text-blue-100/90 mt-1">Consultants available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
