import ts from 'typescript';
import { isValidImportTypeNode } from '../../ast-helpers.js';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if ('jsDoc' in node) {
      const type = ts.getJSDocType(node);
      if (type && isValidImportTypeNode(type)) {
        // TODO Odd to assume this is an `import()` call?
        return { specifier: type.argument.literal.text };
      }
    }
  }
);
