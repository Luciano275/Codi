export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-36 animate-pulse rounded-xl bg-white/10" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center gap-6">
          <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="mb-10 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-2 h-4 w-12 animate-pulse rounded bg-white/10" />
              <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-white/10" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}