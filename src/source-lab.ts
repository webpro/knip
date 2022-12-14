import { ts, Node, SourceFile } from 'ts-morph';
import { findUnusedClassMembers, findUnusedEnumMembers } from './util/members.js';
import {
  _hasReferencingDefaultImport,
  _findReferencingNamespaceNodes,
  _getExportedDeclarations,
  _findReferences,
  hasExternalReferences,
} from './util/project.js';
import { getType } from './util/type.js';
import type { Report, Issue } from './types/issues.js';
import type { Identifier } from 'ts-morph';

type FileLabOptions = {
  report: Report;
  workspaceDirs: string[];
  isIncludeEntryExports: boolean;
};

/**
 * - Collects files to skip exports analysis for
 * - Analyzes source files for unused exported values and types
 * - Returns external module specifiers (i.e. potential external dependencies)
 */
export default class SourceLab {
  report;
  workspaceDirs;
  isIncludeEntryExports;
  skipExportsAnalysis;
  isReportExports;
  isReportValues;
  isReportTypes;

  constructor({ report, workspaceDirs, isIncludeEntryExports }: FileLabOptions) {
    this.report = report;
    this.workspaceDirs = workspaceDirs;
    this.isIncludeEntryExports = isIncludeEntryExports;
    this.skipExportsAnalysis = new Set();

    this.isReportValues = report.exports || report.nsExports || report.classMembers;
    this.isReportTypes = report.types || report.nsTypes || report.enumMembers;
    this.isReportExports = this.isReportValues || this.isReportTypes;
  }

  public skipExportsAnalysisFor(filePath: string | string[]) {
    [filePath].flat().forEach(filePath => this.skipExportsAnalysis.add(filePath));
  }

  public analyzeSourceFile(sourceFile: SourceFile) {
    const issues: Set<Issue> = new Set();
    const filePath = sourceFile.getFilePath();

    if (this.skipExportsAnalysis.has(filePath)) return issues;

    if (this.isReportExports) {
      const exportsIssues = this.analyzeExports(sourceFile);
      exportsIssues.forEach(issue => issues.add(issue));
    }

    return issues;
  }

  private analyzeExports(sourceFile: SourceFile) {
    const issues: Set<Issue> = new Set();
    const report = this.report;
    const filePath = sourceFile.getFilePath();

    // The file is used, let's visit all export declarations to see which of them are not used somewhere else
    const exportDeclarations = _getExportedDeclarations(sourceFile);

    exportDeclarations.forEach(declarations => {
      declarations.forEach(declaration => {
        const type = getType(declaration);

        if (type && !this.isReportTypes) return;
        if (!type && !this.isReportValues) return;

        // Leave exports with a JSDoc `@public` tag alone
        if (ts.getJSDocPublicTag(declaration.compilerNode)) return;

        // TODO: Find out why we have to do this
        if (Node.isJSDocTag(declaration)) return;

        let identifier: Identifier | undefined;
        let fakeIdentifier: string | undefined;

        // Analyze unused enum/class members before potential early bail-out of default exports
        if (declaration.isKind(ts.SyntaxKind.EnumDeclaration)) {
          identifier = declaration.getFirstChildByKind(ts.SyntaxKind.Identifier);
          if (report.enumMembers) {
            findUnusedEnumMembers(declaration, filePath).forEach(symbol => {
              issues.add({ type: 'enumMembers', filePath, symbol, parentSymbol: identifier?.getText() });
            });
          }
        } else if (declaration.isKind(ts.SyntaxKind.ClassDeclaration)) {
          identifier = declaration.getFirstChildByKind(ts.SyntaxKind.Identifier);
          if (report.classMembers) {
            findUnusedClassMembers(declaration, filePath).forEach(symbol => {
              issues.add({ type: 'classMembers', filePath, symbol, parentSymbol: identifier?.getText() });
            });
          }
        }

        // Special case: we have to explicitly find references to default exports, and then we can bail out early
        if (
          Node.isExportGetable(declaration) &&
          declaration.isDefaultExport() &&
          _hasReferencingDefaultImport(sourceFile)
        ) {
          return;
        }

        if (!identifier) {
          if (declaration.isKind(ts.SyntaxKind.Identifier)) {
            identifier = declaration;
          } else if (
            declaration.isKind(ts.SyntaxKind.ArrowFunction) ||
            declaration.isKind(ts.SyntaxKind.ObjectLiteralExpression) ||
            declaration.isKind(ts.SyntaxKind.ArrayLiteralExpression) ||
            declaration.isKind(ts.SyntaxKind.StringLiteral) ||
            declaration.isKind(ts.SyntaxKind.NumericLiteral)
          ) {
            // No ReferenceFindableNode/Identifier available for anonymous default exports, let's go the extra mile
            if (!_hasReferencingDefaultImport(sourceFile)) {
              fakeIdentifier = 'default';
            }
          } else if (
            declaration.isKind(ts.SyntaxKind.FunctionDeclaration) ||
            declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
            declaration.isKind(ts.SyntaxKind.InterfaceDeclaration)
          ) {
            identifier = declaration.getFirstChildByKind(ts.SyntaxKind.Identifier);
          } else if (declaration.isKind(ts.SyntaxKind.PropertyAccessExpression)) {
            identifier = declaration.getLastChildByKind(ts.SyntaxKind.Identifier);
          } else {
            identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
          }
        }

        if (identifier || fakeIdentifier) {
          const identifierText = fakeIdentifier ?? identifier?.getText() ?? '*';

          const refs = _findReferences(identifier);

          if (refs.length === 0) {
            issues.add({ type: 'exports', filePath, symbol: identifierText });
          } else {
            if (hasExternalReferences(refs, filePath)) return;

            // No more reasons left to think this identifier is used somewhere else, report it as unreferenced. If
            // it's on a namespace somewhere, report it in a separate issue type.
            const referencingNodes = _findReferencingNamespaceNodes(sourceFile);
            if (referencingNodes.length > 0) {
              // Ignore if namespace is re-exported only by an entry file
              if (!this.isIncludeEntryExports && referencingNodes.length === 1) {
                const referencingSourceFile = referencingNodes.at(0)?.getSourceFile().getFilePath();
                if (this.skipExportsAnalysis.has(referencingSourceFile)) return;
              }

              if (type) {
                issues.add({ type: 'nsTypes', filePath, symbol: identifierText, symbolType: type });
              } else {
                issues.add({ type: 'nsExports', filePath, symbol: identifierText });
              }
            } else if (type) {
              issues.add({ type: 'types', filePath, symbol: identifierText, symbolType: type });
            } else {
              issues.add({ type: 'exports', filePath, symbol: identifierText });
            }
          }
        }
      });
    });

    return issues;
  }
}
