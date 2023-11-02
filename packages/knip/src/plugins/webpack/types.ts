import type { Configuration } from 'webpack';

type Mode = 'none' | 'development' | 'production';
export type Env = { production: boolean };
export type Argv = { mode: Mode };

type Configurations = Configuration | Configuration[];

export type WebpackConfig =
  | Configurations
  | ((env: Env, argv: Argv) => Configurations)
  | (() => Promise<Configuration>);
