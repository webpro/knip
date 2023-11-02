import ts from 'typescript';
import { isImportCall } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (isImportCall(node)) {
      if (node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const specifier = node.arguments[0].text;
        return { specifier, identifier: 'default' };
      }
    }
  }
);
