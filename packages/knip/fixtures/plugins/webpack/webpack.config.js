const getDevelopmentConfig = require('./webpack.dev.js');
const getProductionConfig = require('./webpack.prod.js');

module.exports = (env, argv) => (env.production ? getProductionConfig(env) : getDevelopmentConfig(env));
