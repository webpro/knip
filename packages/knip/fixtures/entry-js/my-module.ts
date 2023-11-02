import * as MyNamespace from './my-namespace.js';

const x = MyNamespace.x;
const y = MyNamespace.y;

export const unused = 1;

export const myExport = y(x);

export type AnyType = any;

export default myExport;
