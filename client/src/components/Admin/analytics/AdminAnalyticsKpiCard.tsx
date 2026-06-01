interface AdminAnalyticsKpiCardProps {
  label: string;
  value: string;
  delta: string;
}

export function AdminAnalyticsKpiCard({
  label,
  value,
  delta,
}: AdminAnalyticsKpiCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5 lg:p-6">
      <p className="text-xs text-muted-foreground sm:text-sm">{delta}</p>
      <p className="mt-3 text-sm sm:mt-4 sm:text-base">{label}</p>
      <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
    </div>
  );
}
