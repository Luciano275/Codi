import type { HTMLAttributes } from 'react';

const fallbackTones = [
  'bg-castillo-400 text-castillo-900',
  'bg-slate-400 text-slate-900',
  'bg-desierto-500 text-desierto-900',
];

interface PlayerAvatarProps extends HTMLAttributes<HTMLDivElement> {
  avatarUrl: string | null;
  displayName: string;
  rank?: number;
  imageClassName?: string;
}

export function PlayerAvatar({
  avatarUrl,
  displayName,
  rank,
  className = '',
  imageClassName = '',
  ...props
}: PlayerAvatarProps) {
  const fallbackTone = rank && rank <= 3 ? fallbackTones[rank - 1] : 'bg-slate-200 text-slate-600';

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden font-candy-beans ${fallbackTone} ${className}`}
      {...props}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={`h-full w-full object-cover ${imageClassName}`} />
      ) : (
        <span aria-hidden>{displayName.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
