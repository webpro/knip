import { subtract } from './script2.js';

// this is NOT reported by knip, because we don't import anything throughout the app from 'module3/index.ts'
export function calculate(a: number, b: number) {
  return subtract(a, b);
}

// this is NOT reported by knip, because we don't import anything throughout the app from 'module3/index.ts'
export const smth = 'smth';
