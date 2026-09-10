import Image from 'next/image';
import cupImage from '@/assets/codi_cup.png';
import styles from './ranking.module.css';

export function MotivationCard() {
  return (
    <section className="relative min-h-84 overflow-hidden rounded-[2rem] bg-linear-to-br from-bosque-500 via-bosque-500 to-lagos-500 p-6 text-white shadow-[0_7px_0_#44398f,0_16px_30px_rgba(68,57,143,.2)] lg:min-h-96">
      <span className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <span className="absolute left-4 top-20 h-2 w-2 rounded-full bg-castillo-300 shadow-[0_0_16px_#f7d44a]" />
      <div className="relative max-w-[54%] sm:max-w-[58%]">
        <h2 className="font-super-pandora text-2xl leading-tight lg:text-3xl">
          ¡Seguí aprendiendo!
        </h2>
        <p className="mt-3 font-simply-olive text-base font-medium leading-6 text-white/85 lg:text-lg">
          Resolvé ejercicios, completá lecciones y mantené tu progreso para subir en el ranking.
        </p>
      </div>
      <Image
        src={cupImage}
        alt="Codi celebrando con una copa"
        priority
        className={`absolute -bottom-4 -right-2 h-52 w-52 object-contain drop-shadow-[0_12px_12px_rgba(18,12,57,.28)] sm:-bottom-6 sm:-right-5 sm:h-64 sm:w-64 lg:h-76 lg:w-76 ${styles.mascot}`}
      />
    </section>
  );
}
