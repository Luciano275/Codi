import type { SandboxCommand } from '@codi/evaluator-contract';

export function buildRestrictedShellCommand(
  request: SandboxCommand,
  options?: { runAs?: string; disableInputEcho?: boolean },
): string {
  const { limits } = request;
  const fileBlocks = Math.ceil((limits.outputKb * 1024) / 512);
  const processLimit = options?.runAs ? Math.max(limits.processes, 16) : limits.processes;
  const commands = [
    'set -euo pipefail',
    `ulimit -t ${Math.ceil(limits.timeSeconds)}`,
    `ulimit -v ${limits.memoryKb}`,
    `ulimit -u ${processLimit}`,
    `ulimit -f ${fileBlocks}`,
  ];
  if (options?.disableInputEcho) commands.push('stty -echo');

  const command = request.command.map(shellQuote).join(' ');
  const execution = options?.runAs
    ? `exec /usr/sbin/runuser --user ${options.runAs} -- ${command}`
    : `exec ${command}`;
  let runWithRedirects = execution;
  if (request.stdin) runWithRedirects += ` < ${shellQuote(request.stdin)}`;
  if (request.stdout) runWithRedirects += ` > ${shellQuote(request.stdout)}`;
  if (request.stderr) runWithRedirects += ` 2> ${shellQuote(request.stderr)}`;
  commands.push(runWithRedirects);
  return commands.join('; ');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
