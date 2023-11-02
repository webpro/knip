import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { compact } from '../../../util/array.js';
import { isGetOrSetAccessorDeclaration, isPrivateMember, stripQuotes } from '../../ast-helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    // @ts-expect-error TODO Property 'modifiers' does not exist on type 'Node'.
    const modifierKinds = (node.modifiers as ts.Modifier[])?.map(modifier => modifier.kind) ?? [];

    if (modifierKinds.includes(ts.SyntaxKind.ExportKeyword)) {
      if (ts.isVariableStatement(node)) {
        // @ts-expect-error TODO Issue seems caused by mismatch between returned `node` types (but all ts.Node)
        return node.declarationList.declarations.flatMap(declaration => {
          if (ts.isObjectBindingPattern(declaration.name)) {
            // Pattern: export const { name1, name2 } = {};
            return compact(
              declaration.name.elements.map(element => {
                if (ts.isIdentifier(element.name)) {
                  return {
                    node: element,
                    identifier: element.name.escapedText.toString(),
                    type: SymbolType.UNKNOWN,
                    pos: element.name.getStart(),
                  };
                }
              })
            );
          } else if (ts.isArrayBindingPattern(declaration.name)) {
            // Pattern: export const [name1, name2] = [];
            return compact(
              declaration.name.elements.map(element => {
                if (ts.isBindingElement(element)) {
                  return {
                    node: element,
                    identifier: element.getText(),
                    type: SymbolType.UNKNOWN,
                    pos: element.getStart(),
                  };
                }
              })
            );
          } else {
            // Pattern: export const MyVar = 1;
            const identifier = declaration.name.getText();
            return { node: declaration, identifier, type: SymbolType.UNKNOWN, pos: declaration.name.getStart() };
          }
        });
      }

      if (ts.isFunctionDeclaration(node) && node.name) {
        const identifier = modifierKinds.includes(ts.SyntaxKind.DefaultKeyword) ? 'default' : node.name.getText();
        const pos = (node.name ?? node.body ?? node).getStart();
        return { node, identifier, pos, type: SymbolType.FUNCTION };
      }

      if (ts.isClassDeclaration(node) && node.name) {
        const identifier = modifierKinds.includes(ts.SyntaxKind.DefaultKeyword) ? 'default' : node.name.getText();
        const pos = (node.name ?? node).getStart();
        const members = node.members
          .filter(
            (member): member is ts.MethodDeclaration | ts.PropertyDeclaration =>
              (ts.isPropertyDeclaration(member) ||
                ts.isMethodDeclaration(member) ||
                isGetOrSetAccessorDeclaration(member)) &&
              !isPrivateMember(member)
          )
          .map(member => ({
            node: member,
            identifier: member.name.getText(),
            pos: member.name.getStart(),
            type: SymbolType.MEMBER,
          }));
        return { node, identifier, type: SymbolType.CLASS, pos, members };
      }

      if (ts.isTypeAliasDeclaration(node)) {
        return { node, identifier: node.name.getText(), type: SymbolType.TYPE, pos: node.name.getStart() };
      }

      if (ts.isInterfaceDeclaration(node)) {
        return { node, identifier: node.name.getText(), type: SymbolType.INTERFACE, pos: node.name.getStart() };
      }

      if (ts.isEnumDeclaration(node)) {
        const identifier = modifierKinds.includes(ts.SyntaxKind.DefaultKeyword) ? 'default' : node.name.getText();
        const pos = node.name.getStart();
        const members = node.members.map(member => ({
          node: member,
          identifier: stripQuotes(member.name.getText()),
          pos: member.name.getStart(),
          type: SymbolType.MEMBER,
        }));
        return { node, identifier, type: SymbolType.ENUM, pos, members };
      }
    }
  }
);
