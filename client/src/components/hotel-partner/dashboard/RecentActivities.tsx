import { Calendar, CalendarX2, Star } from 'lucide-react';

export function RecentActivities() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex-1 cursor-pointer  transition-transform duration-300 hover:scale-102">
      <h3 className="text-base font-bold text-slate-900 mb-6">Recent Activities</h3>
      
      <div className="relative border-l-2 border-slate-100 ml-3.5 space-y-7 pb-2">
        {/* Activity 1 */}
        <div className="relative pl-6">
          <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-role-partner-light flex items-center justify-center border-4 border-white">
            <Calendar className="w-3 h-3 text-role-partner-primary" />
          </div>
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-slate-900 font-bold">New Booking <span className="font-medium text-slate-500">for Deluxe Suite</span></p>
            <span className="text-[10px] font-semibold text-slate-500">Just now</span>
          </div>
          <div className="bg-role-partner-light/60 rounded-lg p-3 flex justify-between items-center mt-2 border border-role-partner-light">
            <div>
              <p className="text-sm font-bold text-slate-900">John Smith</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Oct 12 - Oct 15 {'•'} 3 Nights</p>
            </div>
            <span className="text-sm font-bold text-role-partner-primary">$850</span>
          </div>
        </div>

        {/* Activity 2 */}
        <div className="relative pl-6">
          <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center border-4 border-white">
            <CalendarX2 className="w-3 h-3 text-red-500" />
          </div>
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-slate-900 font-bold">Booking Cancelled <span className="font-medium text-slate-500">for Standard Room</span></p>
            <span className="text-[10px] font-semibold text-slate-500">2 hrs ago</span>
          </div>
          <p className="text-sm text-slate-600 font-medium mt-1">Guest requested cancellation due to travel changes.</p>
        </div>

        {/* Activity 3 */}
        <div className="relative pl-6">
          <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center border-4 border-white">
            <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
          </div>
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm text-slate-900 font-bold">New 5-Star Review <span className="font-medium text-slate-500">via Booking.com</span></p>
            <span className="text-[10px] font-semibold text-slate-500">5 hrs ago</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 mt-2 border border-slate-100">
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
              ))}
            </div>
            <p className="text-sm text-slate-600 italic">"Exceptional service and immaculate rooms. Will definitely return!"</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 text-center">
        <button className="text-sm font-semibold text-role-partner-primary hover:text-role-partner-secondary transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}

