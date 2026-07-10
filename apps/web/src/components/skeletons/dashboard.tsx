export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex h-20 animate-pulse items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="h-[52px] w-[52px] rounded-xl bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-3 w-40 rounded bg-gray-200" />
            <div className="h-2.5 w-28 rounded bg-gray-200" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 rounded-xl bg-gray-200" />
          <div className="h-8 w-20 rounded-xl bg-gray-200" />
          <div className="h-8 w-24 rounded-xl bg-gray-200" />
          <div className="h-10 w-28 rounded-xl bg-gray-200" />
        </div>
      </header>

      <div className="flex">
        <nav className="hidden w-60 flex-col border-r border-gray-200 bg-gray-50/90 p-3 md:flex">
          <div className="mb-4 space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </nav>

        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
                <div className="animate-pulse border-b border-gray-50 px-6 pb-4 pt-5">
                  <div className="h-7 w-56 rounded bg-gray-200" />
                  <div className="mt-1 h-4 w-72 rounded bg-gray-200" />
                </div>
                <div className="p-6">
                  <div className="aspect-[16/9] animate-pulse rounded-2xl bg-gray-100" />
                </div>
              </div>
            </div>

            <aside className="w-full shrink-0 lg:w-80 xl:w-96">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
                    <div className="animate-pulse px-5 py-3">
                      <div className="h-5 w-32 rounded bg-gray-200" />
                    </div>
                    <div className="animate-pulse p-5">
                      <div className="mb-2 h-8 w-20 rounded bg-gray-200" />
                      <div className="h-3 w-full rounded-full bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>

      <div className="border-t border-gray-200 bg-white/95 px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl animate-pulse gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 flex-1 rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
