import React from 'react';
import { Building, CalendarDays, DollarSign, TrendingUp, Warehouse } from 'lucide-react';

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Bookings */}
      <div className="p-5 cursor-pointer   rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between min-h-[140px] transition-transform duration-300 hover:scale-105">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-role-partner-light/80 border border-role-partner-light"> <CalendarDays className='w-10 h-10 text-role-partner-primary p-2' /></div>
          <div className="flex items-center gap-1 text-xs font-medium text-role-partner-primary bg-role-partner-light px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            12%
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Bookings</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">1,284</h3>
        </div>
      </div>
      
      {/* Occupancy Rate */}
      <div className="p-5 cursor-pointer  rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between min-h-[140px] transition-transform duration-300 hover:scale-105">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-role-partner-light/80 border border-role-partner-light"><Building className='w-10 h-10 text-role-partner-primary p-2' /></div>
          <div className="flex items-center gap-1 text-xs font-medium text-role-partner-primary bg-role-partner-light px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            4%
          </div>
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Occupancy Rate</span>
            <span className="text-xl font-bold text-slate-900 leading-none">82%</span>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-role-partner-primary h-full rounded-full" style={{ width: '82%' }}></div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="p-5 cursor-pointer  rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between min-h-[140px] transition-transform duration-300 hover:scale-105">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50/80 border border-emerald-100 flex items-center justify-center">
           <DollarSign className='w-10 h-10 text-role-partner-primary p-2' />
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-role-partner-primary bg-role-partner-light px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            18%
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Monthly Revenue</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">$142k</h3>
          <p className="text-xs text-slate-400 mt-1.5">vs $120k last month</p>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="p-5 cursor-pointer  rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between min-h-[140px] transition-transform duration-300 hover:scale-105">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100/80 border border-slate-200 flex items-center justify-center">
            <Warehouse className='w-10 h-10 text-role-partner-primary p-2' />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Available Rooms</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none mb-2.5">45</h3>
          <div className="flex gap-2">
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">20 Standard</span>
            <span className="text-[10px] font-semibold bg-role-partner-light text-role-partner-primary px-2 py-0.5 rounded-sm">15 Deluxe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

