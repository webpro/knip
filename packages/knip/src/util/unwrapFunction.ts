import { debugLogObject } from './debug.js';

export const unwrapFunction = async (possibleFunction: unknown) => {
  if (typeof possibleFunction === 'function') {
    try {
      return await possibleFunction();
    } catch (error) {
      debugLogObject('*', 'Error executing function:', error);
      throw error;
    }
  }
  return possibleFunction;
};
