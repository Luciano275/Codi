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
      className={`group relative flex flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-xl bg-linear-to-br ${gradient} p-2 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.97] md:rounded-2xl md:p-3 md:gap-3 lg:p-4`}
    >
      <Icon className="h-5 w-5 shrink-0 text-white drop-shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 md:h-6 md:w-6 lg:h-7 lg:w-7" />
      <div className="min-w-0 text-left">
        <p className="font-super-pandora text-xs leading-tight text-white drop-shadow-xs md:text-sm lg:text-base">
          {label}
        </p>
        <p className="hidden font-simply-olive text-[10px] text-white/75 md:text-xs xl:block">
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
