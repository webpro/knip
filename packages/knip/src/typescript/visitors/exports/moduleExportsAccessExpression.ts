import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { isModuleExportsAccessExpression, stripQuotes } from '../../ast-helpers.js';
import { isJS } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(isJS, node => {
  if (isModuleExportsAccessExpression(node)) {
    // Pattern: module.exports
    const parent = node.parent;
    if (ts.isPropertyAccessExpression(parent)) {
      // Pattern: module.exports.NAME
      const identifier = parent.name.getText();
      const pos = parent.name.getStart();
      return { node, identifier, type: SymbolType.UNKNOWN, pos };
    } else if (ts.isElementAccessExpression(parent)) {
      // Pattern: module.exports['NAME']
      const identifier = stripQuotes(parent.argumentExpression.getText());
      const pos = parent.argumentExpression.getStart();
      return { node, identifier, type: SymbolType.UNKNOWN, pos };
    } else if (ts.isBinaryExpression(parent)) {
      const expr = parent.right;
      if (ts.isObjectLiteralExpression(expr) && expr.properties.every(ts.isShorthandPropertyAssignment)) {
        // Pattern: module.exports = { identifier, identifier2 }
        return expr.properties.map(node => {
          return { node, identifier: node.getText(), type: SymbolType.UNKNOWN, pos: node.pos };
        });
      } else {
        // Pattern: module.exports = any
        return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos: node.getStart() };
      }
    }
  }
});
