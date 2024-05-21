import type { SerializableImports, SerializableMap } from '../types/serializable-map.js';
import { exportLookupLog } from './debug.js';

export const getIsIdentifierReferencedHandler = (importedSymbols: SerializableMap) => {
  const isIdentifierReferenced = (
    filePath: string,
    id: string,
    importsForExport?: SerializableImports,
    depth = 0
  ): boolean => {
    if (depth === 0) exportLookupLog(-1, `Looking up export "${id}" from`, filePath);

    const ids = id.split('.');
    if (ids.length > 2 && ids.length !== new Set(ids).size) {
      exportLookupLog(depth, 'circular reference', filePath);
      return false;
    }

    if (!importsForExport) {
      exportLookupLog(depth, 'no imports found from', filePath);
      return false;
    }

    if (ids.length > 1) {
      if (importsForExport.refs.has(id)) {
        exportLookupLog(depth, `referenced ${id} from`, filePath);
        return true;
      }
    }

    if (importsForExport.imported.has(id)) {
      exportLookupLog(depth, `imported ${id} from`, filePath);
      return true;
    }

    for (const [_id, alias] of importsForExport.importedAs) {
      if (ids[0] === _id) {
        exportLookupLog(depth, `imported ${id} as ${alias} by`, filePath);
        return true;
      }
    }

    for (const ns of importsForExport.importedNs) {
      if (importsForExport.refs.has(`${ns}.${id}`)) {
        exportLookupLog(depth, `imported ${id} on ${ns} from`, filePath);
        return true;
      }

      const reExportedAs = importsForExport.reExportedAs.get(ns);

      if (reExportedAs) {
        for (const [alias, filePath] of reExportedAs) {
          const file = importedSymbols[filePath];
          if (file && isIdentifierReferenced(filePath, alias, file.imported, depth + 1)) {
            exportLookupLog(depth, `re-exported as ${alias} by`, filePath);
            return true;
          }
        }
      }

      const reExportedNs = importsForExport.reExportedNs.get(ns);

      if (reExportedNs) {
        for (const filePath of reExportedNs) {
          const file = importedSymbols[filePath];
          if (file && isIdentifierReferenced(filePath, `${ns}.${id}`, file.imported, depth + 1)) {
            exportLookupLog(depth, `re-exported on ${ns} by`, filePath);
            return true;
          }
        }
      }
    }

    const reExportedBy = importsForExport.reExportedBy.get(id) ?? importsForExport.reExportedBy.get('*');

    if (reExportedBy) {
      for (const filePath of reExportedBy) {
        const file = importedSymbols[filePath];
        if (file && isIdentifierReferenced(filePath, id, file.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported ${id} by`, filePath);
          return true;
        }
      }
    }

    const reExportedAs = importsForExport.reExportedAs.get(ids[0]);

    if (reExportedAs) {
      for (const [alias, filePath] of reExportedAs) {
        const [_name, ...rest] = ids;
        const id = [alias, ...rest].join('.');
        const file = importedSymbols[filePath];
        if (file && isIdentifierReferenced(filePath, id, file.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported as ${alias} by`, filePath);
          return true;
        }
      }
    }

    for (const [ns, filePaths] of importsForExport.reExportedNs.entries()) {
      for (const filePath of filePaths) {
        const file = importedSymbols[filePath];
        if (file && isIdentifierReferenced(filePath, `${ns}.${id}`, file.imported, depth + 1)) {
          exportLookupLog(depth, `re-exported on ${ns} by`, filePath);
          return true;
        }
      }
    }

    exportLookupLog(depth, 'not imported from', filePath);
    return false;
  };

  return isIdentifierReferenced;
};
