import ts from 'typescript';
import { importVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        // Re-exports
        if (!node.exportClause) {
          // Pattern: export * from 'specifier';
          return { identifier: '*', specifier: node.moduleSpecifier.text, isReExport: true };
        } else if (node.exportClause.kind === ts.SyntaxKind.NamespaceExport) {
          // Pattern: export * as namespace from 'specifier';
          return { identifier: '*', specifier: node.moduleSpecifier.text, isReExport: true };
        } else {
          // Pattern: export { identifier, identifier2 } from 'specifier';
          const specifier = node.moduleSpecifier; // Assign to satisfy TS
          return node.exportClause.elements.map(element => {
            const identifier = (element.propertyName ?? element.name).getText();
            return { identifier, specifier: specifier.text, isReExport: true };
          });
        }
      }
    }
  }
);
