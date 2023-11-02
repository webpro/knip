import ts from 'typescript';
import type { GetImportsAndExportsOptions, AddExportOptions, AddImportOptions } from '../getImportsAndExports.js';

type FileCondition = (sourceFile: ts.SourceFile) => boolean;
type VisitorFactory<T> = (fileCondition: FileCondition, fn: Visitor<T>) => VisitorCondition<T>;
type VisitorCondition<T> = (sourceFile: ts.SourceFile) => undefined | Visitor<T>;
type Visitor<T> = (node: ts.Node, options: GetImportsAndExportsOptions) => undefined | T | T[];

export const importVisitor: VisitorFactory<AddImportOptions> = (fileCondition, visitorFn) => sourceFile => {
  if (fileCondition(sourceFile)) {
    return (node, options) => visitorFn(node, options);
  }
};

export const exportVisitor: VisitorFactory<AddExportOptions> = (fileCondition, visitorFn) => sourceFile => {
  if (fileCondition(sourceFile)) {
    return (node, options) => visitorFn(node, options);
  }
};

export const scriptVisitor: VisitorFactory<string> = (fileCondition, visitorFn) => sourceFile => {
  if (fileCondition(sourceFile)) {
    return (node, options) => visitorFn(node, options);
  }
};
