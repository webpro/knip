import type { KnipConfig } from '../../../src/index';

const config = async (): Promise<KnipConfig> => ({
  ignore: ['dangling.js'],
});

export default config;
