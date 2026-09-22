import Image from 'next/image';

export default function FullScreenWallpaper() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#b9f5d1]">
      <Image
        src="/login-background.svg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(19,70,54,0.12)_100%)]" />

      <div className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6 md:p-8">
        <div className="flex w-fit items-center gap-3 rounded-2xl bg-white/55 px-3 py-2 shadow-sm backdrop-blur-md sm:px-4">
          <Image
            src="/school_logo.png"
            alt="Escuela de Educación Técnica Nº 3117"
            width={300}
            height={250}
            sizes="60px"
            className="h-11 w-11 rounded-xl object-contain sm:h-13 sm:w-13"
          />
          <div>
            <p className="text-sm font-bold text-[#153e36] sm:text-base">
              Escuela de Educación Técnica Nº 3117
            </p>
            <p className="text-xs font-semibold text-[#276957] sm:text-[13px]">
              Maestro Daniel Óscar Reyes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
