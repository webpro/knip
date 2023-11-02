import defaultArrowFn from './default-arrow-function';
import defaultClass from './default-class';
import defaultFn from './default-function';
import defaultGenFn from './default-generator-function';
import defaultNamedClass from './default-named-class';
import defaultNamedFn from './default-named-function';
import defaultNamedGenFn from './default-named-generator-function';
import _default from './default.js';
import * as MyNamespace from './my-namespace.js';

const nsNumber = MyNamespace.nsNumber;
const nsFunction = MyNamespace.nsFunction;

export const unusedNumber = 1;
export const unusedFunction = async <T>(arg: T) => arg;

export const exportedResult = nsFunction(nsNumber);

export type MyAnyType = any;

export default exportedResult;
