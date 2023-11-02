import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        // Pattern: export { identifier, identifier2 }; export type { Identifier, Identifier2 };
        const type = node.isTypeOnly ? SymbolType.TYPE : SymbolType.UNKNOWN;
        return node.exportClause.elements.map(element => {
          return { node: element, identifier: element.name.getText(), type, pos: element.name.pos };
        });
      }
    }
  }
);
