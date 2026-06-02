import React from 'react';
import { Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart } from 'recharts';

const data = [
  { name: 'Mon', revenue: 3000, bookings: 1500 },
  { name: 'Tue', revenue: 3200, bookings: 4000 },
  { name: 'Wed', revenue: 8000, bookings: 6000 },
  { name: 'Thu', revenue: 7500, bookings: 3200 },
  { name: 'Fri', revenue: 11000, bookings: 12000 },
  { name: 'Sat', revenue: 10500, bookings: 7000 },
  { name: 'Sun', revenue: 12500, bookings: 5000 },
];

export function RevenueBookingChart() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm mb-6 flex-1 min-h-[350px] cursor-pointer  transition-transform duration-300 hover:scale-103">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-base font-bold text-slate-900">Revenue & Booking Trends</h3>
          <p className="text-xs text-slate-500 mt-1">Daily performance over the last 14 days</p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-lg">
          <button className="px-3 py-1 text-[11px] font-semibold bg-white shadow-sm rounded-md text-slate-900 cursor-pointer  ">Line<br/>Chart</button>
          <button className="px-3 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer ">Bar<br/>Chart</button>
        </div>
      </div>
      
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%" >
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 } } style={{
          cursor: "pointer",
        }}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
              tickFormatter={(value) => `$${value/1000}k`}
              dx={-5}
            />
            <RechartsTooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
            />
            <Bar dataKey="bookings" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={18} />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRevenue)" strokeWidth={2.5} />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center items-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-role-partner-primary"></div>
          <span className="text-xs font-semibold text-slate-700">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
          <span className="text-xs font-semibold text-slate-700">Bookings</span>
        </div>
      </div>
    </div>
  );
}

