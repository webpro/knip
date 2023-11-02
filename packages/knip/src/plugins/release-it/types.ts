export type ReleaseItConfig = {
  github?: {
    releaseNotes?: string | (() => string) | null;
  };
  gitlab?: {
    releaseNotes?: string | (() => string) | null;
  };
  plugins?: Record<string, unknown>;
  hooks?: Record<string, string | string[]>;
};
