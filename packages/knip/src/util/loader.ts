import { pathToFileURL } from 'node:url';
import { LoaderError } from './errors.js';
import { loadJSON, loadYAML, loadFile, parseJSON, parseYAML } from './fs.js';
import { extname } from './path.js';
import { timerify } from './Performance.js';
import { jiti } from './register.js';

export const FAKE_PATH = '__FAKE__';

const load = async (filePath: string) => {
  // TODO: Turn into a config issue warning
  if (filePath === FAKE_PATH) return;
  try {
    const ext = extname(filePath);
    if (/rc$/.test(filePath)) {
      const contents = await loadFile(filePath);
      return parseYAML(contents).catch(() => parseJSON(filePath, contents));
    }

    if (ext === '.json' || ext === '.jsonc') {
      return loadJSON(filePath);
    }

    if (ext === '.yaml' || ext === '.yml') {
      return loadYAML(filePath);
    }

    if (ext === '.mjs') {
      const fileUrl = pathToFileURL(filePath);
      const imported = await import(fileUrl.href);
      return imported.default ?? imported;
    }

    return await jiti(filePath);
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

const loadFileAsync = async (filePath: string) => {
  // TODO: Turn into a config issue warning
  if (filePath === FAKE_PATH) return;
  try {
    return await loadFile(filePath);
  } catch (error) {
    throw new LoaderError(`Error loading ${filePath}`, { cause: error });
  }
};

export const _load = timerify(load);
export const _loadFile = timerify(loadFileAsync);
