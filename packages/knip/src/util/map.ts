export const getOrSet = <K extends string, V, T extends Map<K, V>>(map: T, key: K, value: V) => {
  if (!map.has(key)) {
    map.set(key, value);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return map.get(key)!;
};
