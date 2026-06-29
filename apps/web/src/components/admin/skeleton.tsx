export function AdminListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/5 rounded-md bg-gray-200" />
            <div className="h-3 w-2/5 rounded-md bg-gray-100" />
          </div>
          <div className="h-8 w-20 rounded-xl bg-gray-100" />
          <div className="h-8 w-8 rounded-xl bg-gray-100" />
          <div className="h-8 w-8 rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
