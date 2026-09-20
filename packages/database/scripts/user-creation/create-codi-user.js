const path = require('node:path');
const { randomInt, randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { askSecret, askText, ensureInteractiveTerminal } = require('./prompt');
const {
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} = require('./validation');

dotenv.config({ path: path.resolve(__dirname, '../../../..', '.env') });

async function createCodiUser({ accountLabel, cmsSource, role }) {
  ensureInteractiveTerminal();
  console.log(`\nCrear ${accountLabel}\n`);

  const userData = await collectUserData();
  const client = await connectToDatabase();

  try {
    await client.query('BEGIN');
    await ensureUsernameIsAvailable(client, userData.username);

    const cmsUserId = await createSyntheticCmsUserId(client, cmsSource);
    await insertUser(client, { ...userData, cmsSource, cmsUserId, role });
    await client.query('COMMIT');

    console.log(`\n✓ ${capitalize(accountLabel)} creado: @${userData.username}`);
    console.log('Podés iniciar sesión con el usuario y la contraseña indicados.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function collectUserData() {
  const username = await askUntilValid('Usuario: ', validateUsername);
  const displayName = await askUntilValid('Nombre completo: ', validateDisplayName);
  const email = await askUntilValid('Correo electrónico (opcional): ', validateEmail, true);
  const password = await askPassword();

  return { username, displayName, email: email || null, password };
}

async function askUntilValid(question, validate, optional = false) {
  while (true) {
    const value = (await askText(question)).trim();
    if (optional && !value) return value;

    const errorMessage = validate(value);
    if (!errorMessage) return value;

    console.error(`  ${errorMessage}`);
  }
}

async function askPassword() {
  while (true) {
    const password = await askSecret('Contraseña: ');
    const errorMessage = validatePassword(password);
    if (errorMessage) {
      console.error(`  ${errorMessage}`);
      continue;
    }

    const confirmation = await askSecret('Repetir contraseña: ');
    if (password === confirmation) return password;

    console.error('  Las contraseñas no coinciden.');
  }
}

async function connectToDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurada en el archivo .env de la raíz.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

async function ensureUsernameIsAvailable(client, username) {
  const { rowCount } = await client.query('SELECT 1 FROM "codi_user" WHERE "username" = $1', [
    username,
  ]);
  if (rowCount) throw new Error(`El usuario "${username}" ya existe.`);
}

async function createSyntheticCmsUserId(client, cmsSource) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const cmsUserId = -randomInt(1, 2_147_483_647);
    const { rowCount } = await client.query(
      'SELECT 1 FROM "codi_user" WHERE "cmsUserId" = $1 AND "cmsSource" = $2',
      [cmsUserId, cmsSource],
    );
    if (!rowCount) return cmsUserId;
  }

  throw new Error('No se pudo asignar un identificador para la cuenta. Intentá de nuevo.');
}

async function insertUser(client, user) {
  const passwordHash = `bcrypt:${bcrypt.hashSync(user.password, 12)}`;
  await client.query(
    `INSERT INTO "codi_user"
       ("id", "cmsUserId", "cmsSource", "passwordHash", "username", "email", "displayName", "role", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
    [
      randomUUID(),
      user.cmsUserId,
      user.cmsSource,
      passwordHash,
      user.username,
      user.email,
      user.displayName,
      user.role,
    ],
  );
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

module.exports = { createCodiUser };
