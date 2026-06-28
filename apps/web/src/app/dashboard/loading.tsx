export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00D2D3] border-t-transparent" />
      <p className="text-sm text-white/50">Cargando tu dashboard...</p>
    </div>
  );
}
