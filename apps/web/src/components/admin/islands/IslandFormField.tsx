export const islandInputClassName =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-lagos-400 focus:ring-2 focus:ring-lagos-100';

export function IslandFormField({
  label,
  className = '',
  children,
}: React.PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
