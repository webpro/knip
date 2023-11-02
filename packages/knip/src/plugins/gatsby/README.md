# Gatsby

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `gatsby`
- `gatsby-cli`

## Default configuration

```json
{
  "gatsby": {
    "config": ["gatsby-{config,node}.{js,jsx,ts,tsx}", "plugins/**/gatsby-node.{js,jsx,ts,tsx}"],
    "entry": [
      "gatsby-{browser,ssr}.{js,jsx,ts,tsx}",
      "src/api/**/*.{js,ts}",
      "src/pages/**/*.{js,jsx,ts,tsx}",
      "src/templates/**/*.{js,jsx,ts,tsx}",
      "src/html.{js,jsx,ts,tsx}",
      "plugins/**/gatsby-{browser,ssr}.{js,jsx,ts,tsx}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
