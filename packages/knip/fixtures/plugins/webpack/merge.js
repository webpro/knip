module.exports = function dumbMerge(c1, c2) {
  c1.mode = c2.mode;
  c1.entry = c2.entry;
  c1.plugins.push(...c2.plugins);
  c1.module.rules.push(...c2.module.rules);
  c1.optimization.minimizer = c2.optimization?.minimizer ?? c1.optimization.minimizer;
  return c1;
};
