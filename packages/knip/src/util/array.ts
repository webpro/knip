export const compact = <T>(collection: (T | undefined)[]) =>
  Array.from(new Set(collection)).filter((value): value is T => Boolean(value));

export const arrayify = (value?: string[] | string) =>
  Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
