'use client';

import Image from 'next/image';

export default function FullScreenWallpaper() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0f0f1a]">
      <Image
        src="/horizontal_wallpaper.png"
        alt=""
        fill
        sizes="100vw"
        className="hidden lg:block object-cover object-center brightness-[0.35]"
        priority
        aria-hidden="true"
      />
      <Image
        src="/vertical_map.png"
        alt=""
        fill
        sizes="100vw"
        className="block lg:hidden object-cover object-center brightness-[0.35]"
        priority
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/10" />

      <div className="absolute top-0 left-0 right-0 p-6 md:p-8 z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/school_logo.png"
            alt="Escuela de Educación Técnica Nº 3117"
            width={300}
            height={250}
            className="w-full max-w-[60px] h-auto rounded-xl object-contain"
          />
          <div>
            <p className="text-white text-[16px] font-bold uppercase tracking-widest drop-shadow-sm">
              Escuela de Educación Técnica Nº 3117
            </p>
            <p className="text-white/70 text-[13px] font-bold uppercase tracking-widest drop-shadow-sm">
              Maestro Daniel Óscar Reyes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
