export function AdminAnalyticsCharts() {
  return (
    <section className="grid gap-5 lg:gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <h2 className="text-xl font-bold sm:text-2xl">Revenue Growth</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Monthly income trajectory vs target
        </p>
        <div className="mt-5 h-64 rounded-xl bg-gradient-to-b from-blue-50 to-white sm:mt-6 sm:h-80" />
      </div>
      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <h2 className="text-xl font-bold sm:text-2xl">User Demographics</h2>
        <div className="mx-auto mt-6 size-44 rounded-full border-[18px] border-blue-500 border-r-green-700 border-b-black sm:size-56 sm:border-[24px]" />
      </div>
    </section>
  );
}
