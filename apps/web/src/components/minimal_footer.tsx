export default function MinimalFooter () {
  return (
    <footer className="absolute bottom-0 left-0 right-0 z-20 py-4 px-6 flex items-center justify-center">
      <p className="text-center text-xs font-semibold text-[#174b3d]/65 sm:text-sm">
        &copy; Creado por{' '}
        <a href="https://github.com/Luciano275" target="_blank" className="text-[#174b3d] transition-colors hover:text-[#0d6b50]">Luna Luciano</a>
        {' '}&{' '}
        <a href="https://www.instagram.com/albertuki__" target="_blank" className="text-[#174b3d] transition-colors hover:text-[#0d6b50]">Alberti Santiago</a>
        {' '}- {new Date().getFullYear()}
      </p>
    </footer>
  )
}
