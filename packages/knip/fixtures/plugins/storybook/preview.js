import 'cypress-storybook/react';

export const decorators = [withFluentProvider, withStrictMode];

export const parameters = {
  viewMode: 'docs',
  controls: {
    disable: true,
    expanded: true,
  },
  docs: {
    source: {
      excludeDecorators: true,
    },
  },
};
