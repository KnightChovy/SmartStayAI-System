/** Skeleton shimmer cho toàn trang Analytics khi đang fetch (A6) — giữ layout, tránh nhảy. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 mb-3" />
            <div className="h-6 w-2/3 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-1/2 bg-slate-100 rounded mb-3" />
            <div className="h-3 w-2/5 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-4 w-48 bg-slate-100 rounded mb-6" />
        <div className="h-64 bg-slate-50 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="h-4 w-40 bg-slate-100 rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="h-4 w-32 bg-slate-100 rounded mb-6" />
          <div className="h-40 bg-slate-50 rounded-full mx-auto w-40" />
        </div>
      </div>
    </div>
  );
}
