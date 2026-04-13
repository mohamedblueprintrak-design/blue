export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 space-y-3">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-64 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}
