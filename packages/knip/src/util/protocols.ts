export const toBinary = (specifier: string) => specifier.replace(/^(bin:)?/, 'bin:');

export const fromBinary = (specifier: string) => specifier.replace(/^(bin:)?/, '');

export const isBinary = (specifier: string) => specifier.startsWith('bin:');

export const toEntryPattern = (specifier: string) => specifier.replace(/^(entry:)?/, 'entry:');

export const fromEntryPattern = (specifier: string) => specifier.replace(/^(entry:)?/, '');

export const isEntryPattern = (specifier: string) => specifier.startsWith('entry:');

export const toProductionEntryPattern = (specifier: string) => specifier.replace(/^(production:)?/, 'production:');

export const fromProductionEntryPattern = (specifier: string) => specifier.replace(/^(production:)?/, '');

export const isProductionEntryPattern = (specifier: string) => specifier.startsWith('production:');
