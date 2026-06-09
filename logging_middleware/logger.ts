export function logMessage(level: string, msg: string) {
  const time = new Date().toISOString();
  if (level === 'error') {
    process.stderr.write(`[${time}] ERROR: ${msg}\n`);
  } else {
    process.stdout.write(`[${time}] ${level.toUpperCase()}: ${msg}\n`);
  }
}
