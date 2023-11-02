export const unusedFn = () => {};

/** @internal */
export const internalFn = () => {};

/** @internal */
export const internalUnusedFn = () => {};

/** @alpha */
export const alphaFn = () => {};

/** @beta */
export const betaFn = () => {};

/** @public */
export const publicFn = () => {};

/** @unknown @ invalid */
export const invalidTaggedFn = () => {};

/** @public */
export function overloadFn(x: number): string;
export function overloadFn(x: boolean): number;
export function overloadFn(x: number | boolean): string | number {
  return '0';
}
