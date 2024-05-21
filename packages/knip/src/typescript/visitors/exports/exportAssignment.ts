import ts from 'typescript';
import type { Fix } from '../../../types/exports.js';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';

export default visit(
  () => true,
  (node, { isFixExports }) => {
    if (ts.isExportAssignment(node)) {
      // Patterns:
      // export default 1;
      // export = identifier;
      const pos = node.getChildAt(1).getStart();
      const fix: Fix = isFixExports ? [node.getStart(), node.getEnd() + 1] : undefined;
      // @ts-expect-error We need the symbol in `addExport`
      const symbol = node.getSourceFile().locals?.get(node.expression.escapedText);
      return { node, symbol, identifier: 'default', type: SymbolType.UNKNOWN, pos, fix };
    }
  }
);
