const { createCodiUser } = require('./user-creation/create-codi-user');

createCodiUser({ accountLabel: 'estudiante', cmsSource: 'USER', role: 'STUDENT' }).catch(
  (error) => {
    console.error(`\n✗ No se pudo crear el estudiante: ${error.message}`);
    process.exitCode = 1;
  },
);
