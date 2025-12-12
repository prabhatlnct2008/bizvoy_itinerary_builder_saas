import React from 'react';
import { Hotel, Camera, Utensils, Car } from 'lucide-react';

export interface TripOverview {
  total_days: number;
  total_nights: number;
  accommodation_count: number;
  activity_count: number;
  meal_count: number;
  transfer_count: number;
}

interface TripOverviewSectionProps {
  overview: TripOverview;
}

const TripOverviewSection: React.FC<TripOverviewSectionProps> = ({ overview }) => {
  const hasAnyStats =
    overview.accommodation_count > 0 ||
    overview.activity_count > 0 ||
    overview.meal_count > 0 ||
    overview.transfer_count > 0;

  if (!hasAnyStats) {
    return null;
  }

  return (
    <section>
      {/* Section Header with Lines */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-slate-200"></div>
        <h2 className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
          Trip Overview
        </h2>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overview.accommodation_count > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{overview.accommodation_count}</p>
            <p className="text-sm text-slate-500">Accommodations</p>
          </div>
        )}

        {overview.activity_count > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{overview.activity_count}</p>
            <p className="text-sm text-slate-500">Activities</p>
          </div>
        )}

        {overview.meal_count > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{overview.meal_count}</p>
            <p className="text-sm text-slate-500">Meals Included</p>
          </div>
        )}

        {overview.transfer_count > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mb-4">
              <Car className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{overview.transfer_count}</p>
            <p className="text-sm text-slate-500">Transfers</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TripOverviewSection;
