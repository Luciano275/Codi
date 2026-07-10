import type { ElementType } from 'react';
import Link from 'next/link';

interface BottomActionCardProps {
  icon: ElementType;
  label: string;
  description: string;
  gradient: string;
  href?: string;
}

export default function BottomActionCard({ icon: Icon, label, description, gradient, href }: BottomActionCardProps) {
  const content = (
    <div
      className={`group relative flex flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-linear-to-br ${gradient} p-3 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.97] md:p-4`}
    >
      <Icon className="h-6 w-6 shrink-0 text-white drop-shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 md:h-7 md:w-7" />
      <div className="min-w-0 text-left">
        <p className="font-super-pandora text-sm leading-tight text-white drop-shadow-xs md:text-base">
          {label}
        </p>
        <p className="font-simply-olive text-[10px] text-white/75 md:text-xs">
          {description}
        </p>
      </div>
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/5" />
      <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-white/5" />
    </div>
  );

  if (href) {
    return <Link href={href} className="flex-1">{content}</Link>;
  }

  return <button className="flex-1">{content}</button>;
}
