# Babel

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `/^@babel\//`

## Default configuration

```json
{
  "babel": {
    "config": ["babel.config.json", "babel.config.js", ".babelrc.json", ".babelrc.js", ".babelrc", "package.json"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
