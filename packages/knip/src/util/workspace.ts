// Paths sorter predicate function, starting with "root", ends with "the/deep/est/path"
export const byPathDepth = (a: string, b: string) => {
  const depthA = a.split('/');
  const depthB = b.split('/');
  if (depthA.length !== depthB.length) return depthA.length - depthB.length;
  if (depthA.includes('*') || depthA.includes('**')) return -1;
  if (depthB.includes('*') || depthB.includes('**')) return 1;
  return a.length - b.length;
};
