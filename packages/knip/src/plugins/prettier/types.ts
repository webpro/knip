export type PrettierConfig = {
  plugins?: (
    | string
    | {
        parsers?: Record<string, unknown>;
        printers?: Record<string, unknown>;
        languages?: unknown[];
        options?: Record<string, unknown>;
      }
  )[];
};
