export default function MinimalFooter () {
  return (
    <footer className="login-footer absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center px-6">
      <p className="text-white/30 text-center font-medium">
        &copy; Creado por{' '}
        <a href="https://github.com/Luciano275" target="_blank" className="text-white/50 hover:text-lagos-400 transition-colors">Luna Luciano</a>
        {' '}&{' '}
        <a href="https://www.instagram.com/albertuki__" target="_blank" className="text-white/50 hover:text-lagos-400 transition-colors">Alberti Santiago</a>
        {' '}- {new Date().getFullYear()}
      </p>
    </footer>
  )
}
