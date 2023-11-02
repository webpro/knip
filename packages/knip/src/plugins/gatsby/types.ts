export type GatsbyConfig = {
  plugins: (string | { resolve: string })[];
};

export type GatsbyActions = {
  actions: {
    setBabelPlugin: ({ name }: { name: string }) => void;
  };
};

export type GatsbyNode = {
  onCreateBabelConfig: (options: GatsbyActions) => void;
};
