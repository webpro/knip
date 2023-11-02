export interface NxProjectConfiguration {
  targets?: {
    [targetName: string]: {
      executor?: string;
      options?: {
        command?: string;
        commands?: string[];
      };
    };
  };
}
