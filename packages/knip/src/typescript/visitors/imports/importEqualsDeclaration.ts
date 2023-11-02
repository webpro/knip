import ts from 'typescript';
import { isNotJS } from '../helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(isNotJS, node => {
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference) &&
    ts.isStringLiteralLike(node.moduleReference.expression)
  ) {
    // Pattern: import identifier = require('specifier')
    const specifier = node.moduleReference.expression.text;
    return { specifier, identifier: 'default' };
  }
});
