import util from 'node:util';
import chalk from 'chalk';
import parsedArgValues from './cli-arguments.js';

const { debug, 'debug-file-filter': debugFileFilter } = parsedArgValues;

const IS_ENABLED = debug ?? false;
const FILE_FILTER = debugFileFilter;

const inspectOptions = { maxArrayLength: null, depth: null, colors: true };

const ctx = (text: string | [string, string]) =>
  typeof text === 'string' ? chalk.yellow(`[${text}]`) : `${chalk.yellow(`[${text[0]}]`)} ${chalk.cyan(text[1])}`;

// Inspect arrays, otherwise Node [will, knip, ...n-100 more items]
const logArray = (collection: string[]) => {
  if (FILE_FILTER) {
    const fileFilter = new RegExp(FILE_FILTER);
    const files = collection.filter(filePath => fileFilter.test(filePath));
    console.log(util.inspect(files.sort(), inspectOptions));
  } else {
    console.log(util.inspect(collection.sort(), inspectOptions));
  }
};

export const debugLog = (context: string, message: string) => {
  if (!IS_ENABLED) return;
  console.log(`${ctx(context)} ${message}`);
};

export const debugLogObject = (context: string, name: string, obj: unknown | (() => unknown)) => {
  if (!IS_ENABLED) return;
  console.log(`${ctx(context)} ${name}`);
  console.log(util.inspect(typeof obj === 'function' ? obj() : obj, inspectOptions));
};

export const debugLogArray = (
  context: string | [string, string],
  message: string,
  elements: string[] | Set<string>
) => {
  if (!IS_ENABLED) return;
  const collection = Array.from(elements);
  console.debug(`${ctx(context)} ${message} (${collection.length})`);
  logArray(collection);
};
