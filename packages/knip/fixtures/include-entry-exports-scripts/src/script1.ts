// this is NOT reported by knip, because we don't import anything throughout the app from 'module1/index.ts'
export function sum(a: number, b: number) {
  return a + b;
}

// this is NOT reported by knip, because we don't import anything throughout the app from 'module1/index.ts'
export function multiply(a: number, b: number) {
  return a * b;
}
