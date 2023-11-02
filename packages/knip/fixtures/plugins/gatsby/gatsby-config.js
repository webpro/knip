module.exports = {
  siteMetadata: {
    title: 'knip',
  },
  plugins: [
    {
      resolve: '@sentry/gatsby',
      options: {},
    },
    {
      resolve: 'gatsby-plugin-webpack-bundle-analyser-v2',
      options: {},
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-postcss',
    {
      resolve: 'gatsby-plugin-create-client-paths',
    },
    {
      resolve: 'gatsby-source-filesystem',
    },
    {
      resolve: 'gatsby-transformer-remark',
    },
    {
      resolve: 'gatsby-remark-node-identity',
    },
    {
      resolve: 'gatsby-remark-node-identity',
      options: {
        identity: 'superBlockIntroMarkdown',
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
    },
    'gatsby-plugin-remove-serviceworker',
  ],
};
