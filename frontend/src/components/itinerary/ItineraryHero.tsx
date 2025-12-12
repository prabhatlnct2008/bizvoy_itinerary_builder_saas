import React from 'react';
import { Calendar, Globe, Users, Plane } from 'lucide-react';

export interface ItineraryHeroProps {
  clientName: string;
  destination: string;
  startDate: string;
  endDate: string;
  numAdults: number;
  numChildren: number;
  totalDays: number;
  totalNights: number;
}

const ItineraryHero: React.FC<ItineraryHeroProps> = ({
  clientName,
  destination,
  startDate,
  endDate,
  numAdults,
  numChildren,
  totalDays,
  totalNights,
}) => {
  const nameParts = clientName?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const totalGuests = numAdults + numChildren;

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <section className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-10 relative overflow-hidden">
      {/* Decorative plane icon */}
      <div className="absolute top-8 right-8 w-16 h-16 rounded-full border-2 border-amber-400/30 flex items-center justify-center">
        <Plane className="w-7 h-7 text-amber-400 rotate-45" />
      </div>

      {/* Welcome Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-px bg-amber-400"></div>
        <span className="text-amber-400 text-xs font-semibold tracking-[0.2em] uppercase">
          Welcome Aboard
        </span>
      </div>

      {/* Main Greeting */}
      <h1 className="text-4xl md:text-5xl font-light text-white mb-3">
        Hello, <span className="font-bold">{firstName} {lastName}</span>
      </h1>

      {/* Subtitle */}
      <p className="text-slate-300 text-base md:text-lg max-w-xl mb-8">
        Your journey to <span className="text-white font-medium">{destination}</span> awaits.
        Here's everything you need for an unforgettable adventure.
      </p>

      {/* Info Pills */}
      <div className="flex flex-wrap gap-3">
        {/* Duration */}
        <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Duration</p>
            <p className="text-white font-semibold">
              {totalDays} Days / {totalNights} Nights
            </p>
          </div>
        </div>

        {/* Destination */}
        <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Destination</p>
            <p className="text-white font-semibold">{destination}</p>
          </div>
        </div>

        {/* Travelers */}
        <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Travelers</p>
            <p className="text-white font-semibold">
              {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Travel Dates */}
        <div className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Travel Dates</p>
            <p className="text-white font-semibold">
              {formatDateRange(startDate, endDate)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ItineraryHero;
