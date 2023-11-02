// this function is imported in module3/index.ts
export function subtract(a: number, b: number) {
  return a - b;
}

// this is reported by knip correctly, because we import 'subtract()' at 'module3/index.ts
export const test = 23;
