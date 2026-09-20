const { createCodiUser } = require('./user-creation/create-codi-user');

createCodiUser({ accountLabel: 'docente', cmsSource: 'ADMIN', role: 'TEACHER' }).catch((error) => {
  console.error(`\n✗ No se pudo crear el docente: ${error.message}`);
  process.exitCode = 1;
});
