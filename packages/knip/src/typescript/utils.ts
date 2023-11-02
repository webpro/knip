function toRealFilePath(filePath: string) {
  return filePath.slice(0, -'.ts'.length);
}

export function isVirtualFilePath(filePath: string, extensions: string[]) {
  return extensions.some(extension => filePath.endsWith(`${extension}.ts`));
}

export function ensureRealFilePath(filePath: string, extensions: string[]) {
  return isVirtualFilePath(filePath, extensions) ? toRealFilePath(filePath) : filePath;
}
