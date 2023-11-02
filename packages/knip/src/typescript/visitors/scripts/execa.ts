import ts from 'typescript';
import { stripQuotes } from '../../ast-helpers.js';
import { scriptVisitor as visit } from '../index.js';

export default visit(
  sourceFile => sourceFile.statements.some(statementImportsExeca$),
  node => {
    if (ts.isTaggedTemplateExpression(node)) {
      if (node.tag.getText() === '$' || (ts.isCallExpression(node.tag) && node.tag.expression.getText() === '$')) {
        return stripQuotes(node.template.getText());
      }
    }
  }
);

function statementImportsExeca$(node: ts.Statement): boolean {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === 'execa' &&
    !!node.importClause?.namedBindings &&
    ts.isNamedImports(node.importClause.namedBindings) &&
    node.importClause.namedBindings.elements.some(element => element.name.text === '$')
  );
}
