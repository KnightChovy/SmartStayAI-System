import { BedDouble } from 'lucide-react';

const topRooms = [
  { name: 'Deluxe Ocean View', bookings: 42, revenue: '$12.4k' },
  { name: 'Executive Suite', bookings: 28, revenue: '$9.8k' },
  { name: 'Standard Double', bookings: 64, revenue: '$7.2k' },
];

export function TopPerformingRooms() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
      <h3 className="text-base font-bold text-slate-900 mb-5">Top Performing Rooms</h3>
      <div className="space-y-4">
        {topRooms.map((room, i) => (
          <div key={i} className="flex items-center justify-between cursor-pointer transition-transform duration-300 hover:scale-105">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100/80 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                <BedDouble className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{room.name}</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{room.bookings} Bookings</p>
              </div>
            </div>
            <span className="text-sm font-bold text-role-partner-primary">{room.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

