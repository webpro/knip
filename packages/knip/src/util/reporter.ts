import internalReporters from '../reporters/index.js';
import parsedArgValues from '../util/cli-arguments.js';
import { _load } from './loader.js';
import { isInternal, resolve } from './path.js';
import type { ReporterOptions } from '../types/issues.js';

const { preprocessor = [], reporter = ['symbols'] } = parsedArgValues;

const preprocessors = await Promise.all(preprocessor.map(proc => _load(isInternal(proc) ? resolve(proc) : proc)));

export const runPreprocessors = (data: ReporterOptions, processors = preprocessors): Promise<ReporterOptions> =>
  processors.length === 0 ? Promise.resolve(data) : runPreprocessors(processors[0](data), processors.slice(1));

const reporters = await Promise.all(
  reporter.map(async reporter => {
    return reporter in internalReporters
      ? internalReporters[reporter as keyof typeof internalReporters]
      : await _load(isInternal(reporter) ? resolve(reporter) : reporter);
  })
);

export const runReporters = async (options: ReporterOptions) => {
  for (const reporter of reporters) await reporter(options);
};
