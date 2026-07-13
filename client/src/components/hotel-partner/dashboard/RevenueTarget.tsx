
export function RevenueTarget() {
  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center text-center">
      <h3 className="text-base font-bold text-slate-900 mb-8 w-full text-left">Revenue Target</h3>
      
      {/* Circular Progress */}
      <div className="relative w-36 h-36 mb-6 cursor-pointer transition-transform duration-300 hover:scale-105">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle 
            className="text-slate-100 stroke-current" 
            strokeWidth="12" 
            cx="50" 
            cy="50" 
            r="40" 
            fill="transparent"
          ></circle>
          <circle 
            className="text-role-partner-primary stroke-current" 
            strokeWidth="12" 
            strokeLinecap="round" 
            cx="50" 
            cy="50" 
            r="40" 
            fill="transparent" 
            strokeDasharray="251.2" 
            strokeDashoffset="62.8"
          ></circle>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-900 leading-none">75%</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-widest">OF GOAL</span>
        </div>
      </div>
      
      <p className="text-[13px] text-slate-600 leading-relaxed px-4">
        You need <span className="font-bold text-slate-900">$48,000</span> more to reach your monthly goal of $190,000.
      </p>
    </div>
  );
}

