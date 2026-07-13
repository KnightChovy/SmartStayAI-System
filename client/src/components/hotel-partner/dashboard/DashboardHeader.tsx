import { Button } from '../../ui/button';
import {  Download } from 'lucide-react';

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening today.</p>
      </div>
      <div className="flex items-center gap-3">
       
        <Button className="h-12 px-6 text-base font-semibold bg-role-partner-primary hover:bg-role-partner-secondary cursor-pointer transition-transform duration-300 hover:scale-105 shadow-sm">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
