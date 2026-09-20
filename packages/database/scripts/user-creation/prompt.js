const readline = require('node:readline');

function ensureInteractiveTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Este comando debe ejecutarse desde una terminal interactiva.');
  }
}

async function askText(question) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await prompt.question(question);
    if (answer === undefined) throw new Error('Operación cancelada.');
    return answer;
  } finally {
    prompt.close();
  }
}

function askSecret(question) {
  return new Promise((resolve, reject) => {
    let value = '';
    const input = process.stdin;
    const output = process.stdout;
    const wasRaw = input.isRaw;

    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();
    output.write(question);

    const onKeypress = (character, key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Operación cancelada.'));
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        output.write('\n');
        resolve(value);
        return;
      }

      if (key.name === 'backspace') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          output.write('\b \b');
        }
        return;
      }

      if (character && !key.ctrl && !key.meta) {
        value += character;
        output.write('*');
      }
    };

    function cleanup() {
      input.removeListener('keypress', onKeypress);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
    }

    input.on('keypress', onKeypress);
  });
}

module.exports = { askSecret, askText, ensureInteractiveTerminal };
