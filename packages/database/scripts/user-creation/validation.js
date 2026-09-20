const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;

function validateUsername(username) {
  if (!USERNAME_PATTERN.test(username)) {
    return 'Usá entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo.';
  }
}

function validateDisplayName(displayName) {
  if (!displayName || displayName.length > 100) {
    return 'Ingresá un nombre de entre 1 y 100 caracteres.';
  }
}

function validateEmail(email) {
  if (email && !EMAIL_PATTERN.test(email)) {
    return 'Ingresá un correo válido o dejá el campo vacío.';
  }
}

function validatePassword(password) {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
}

module.exports = { validateDisplayName, validateEmail, validatePassword, validateUsername };
