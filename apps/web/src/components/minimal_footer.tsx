export default function MinimalFooter () {
  return (
    <footer className="absolute bottom-0 left-0 right-0 z-20 py-4 px-6 flex items-center justify-center">
      <p className="text-white/30 text-sm font-medium tracking-wide">
        &copy; Creado por{' '}
        <a href="https://github.com/Luciano275" target="_blank" className="text-white/50 hover:text-lagos-400 transition-colors">Luna Luciano</a>
        {' '}&{' '}
        <a href="#" target="_blank" className="text-white/50 hover:text-lagos-400 transition-colors">Alberti Santiago</a>
        {' '}- {new Date().getFullYear()}
      </p>
    </footer>
  )
}