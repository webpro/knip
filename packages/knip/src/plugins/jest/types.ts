import type { Config } from '@jest/types';

export type JestInitialOptions = Config.InitialOptions;

export type JestConfig = JestInitialOptions | (() => JestInitialOptions) | (() => Promise<JestInitialOptions>);
