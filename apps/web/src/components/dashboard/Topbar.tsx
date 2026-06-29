import Image from 'next/image';
import PythonLogo from '@/assets/python.svg';

export default function Topbar() {
  return (
    <header className="grid grid-cols-3 p-4 shadow-md">
      <div className="flex items-center gap-4">
        <Image
          src={'/school_logo.png'}
          alt="EET 3117 Logo"
          width={80}
          height={70}
          priority
          className="w-full max-w-[60px] lg:max-w-[80px] h-auto object-contain"
        />
        <h2 className="text-lg lg:text-xl font-bold">
          Escuela de Educación
          <br />
          Técnica Nº 3117
        </h2>
      </div>
      <div className='flex items-center gap-4 place-self-center'>
        <Image
          src={PythonLogo}
          alt="Python Logo"
          width={70}
          height={70}
          className="w-full max-w-17.5 h-auto object-contain"
        />
        <div>
          <h1 className='text-2xl font-bold'>Programación Competitiva</h1>
          <h2>Con Python</h2>
        </div>
      </div>
      <div className='place-self-center'>
        stats
      </div>
    </header>
  );
}
