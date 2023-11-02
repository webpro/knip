import { Preprocessor } from '../../src/types/issues';

const minimal: Preprocessor = value => ({
  ...value,
  issues: {
    ...value.issues,
    files: new Set([...value.issues.files, import.meta.url]),
  },
});

export default minimal;
