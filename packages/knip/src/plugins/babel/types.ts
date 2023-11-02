import { api } from './helpers.js';

type BabelConfigFn = (options: typeof api) => BabelConfigObj;

export type BabelConfigObj = {
  plugins?: (string | [string, unknown])[];
  presets?: (string | [string, unknown])[];
  env?: Record<string, BabelConfigObj>;
};

export type BabelConfig = BabelConfigObj | BabelConfigFn;
