import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isExportAssignment(node)) {
      // Patterns:
      // export default 1;
      // export = identifier;
      const pos = node.getChildAt(1).getStart();
      return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos };
    }
  }
);
