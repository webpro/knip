import { execSync } from 'node:child_process';
// eslint-disable-next-line n/no-restricted-import
import { resolve } from 'node:path';

const cliPath = resolve('dist/cli.js');

export const execFactory = (cwd: string) => {
  return (command: string) => {
    try {
      const output = execSync(command.replace(/^knip/, `node ${cliPath}`), { cwd });
      return output.toString().trim();
    } catch (error) {
      if (error instanceof Error && 'stdout' in error && Buffer.isBuffer(error['stdout'])) {
        return error['stdout'].toString();
      }
      // Unknown error
      throw error;
    }
  };
};
