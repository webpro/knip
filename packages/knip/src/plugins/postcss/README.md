# PostCSS

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `postcss`
- `next`

## Default configuration

```json
{
  "postcss": {
    "config": ["postcss.config.{cjs,js}", "postcss.config.json", "package.json"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
