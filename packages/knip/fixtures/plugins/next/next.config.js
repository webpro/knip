const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const withTM = require('next-transpile-modules')([]);

module.exports = phase => {
  const config = withTM({});
  return {
    ...config,
  };
};
