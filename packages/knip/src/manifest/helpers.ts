import { join } from '../util/path.js';
import { _require } from '../util/require.js';

type Options = { dir: string; packageName: string; cwd: string };

export const getPackageManifest = async ({ dir, packageName, cwd }: Options) => {
  // TODO Not sure what's the most efficient way to get a package.json, but this seems to do the job across package
  // managers (npm, Yarn, pnpm)
  try {
    return _require(join(dir, 'node_modules', packageName, 'package.json'));
  } catch (error) {
    if (dir !== cwd) {
      try {
        return _require(join(cwd, 'node_modules', packageName, 'package.json'));
      } catch (error) {
        // Explicitly suppressing errors here
      }
    }
    // Explicitly suppressing errors here
  }
};
