import { PlusCircle, Package, TrendingUp, Hotel } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm mb-6">
      <h3 className="text-base font-bold text-slate-900 mb-5">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="flex flex-col items-center justify-center py-5 px-2 rounded-xl bg-role-partner-light/50 hover:bg-role-partner-light border border-role-partner-light transition-colors cursor-pointer duration-300 hover:scale-105">
          <div className="w-8 h-8 rounded-full bg-white text-role-partner-primary flex items-center justify-center mb-3 shadow-sm border border-role-partner-light">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Add Room</span>
        </button>
        <button className="flex flex-col items-center justify-center py-5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer duration-300 hover:scale-105">
          <div className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center mb-3 shadow-sm border border-slate-100">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">
            Update Room Inventory
          </span>
        </button>
        <button className="flex flex-col items-center justify-center py-5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer  duration-300 hover:scale-105">
          <div className="w-8 h-8 rounded-full bg-white text-role-partner-primary flex items-center justify-center mb-3 shadow-sm border border-slate-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">View Revenue</span>
        </button>
        <button className="flex flex-col items-center justify-center py-5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors cursor-pointer  duration-300 hover:scale-105">
          <div className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center mb-3 shadow-sm border border-slate-100">
            <Hotel className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">Manage Hotel</span>
        </button>
      </div>
    </div>
  );
}
