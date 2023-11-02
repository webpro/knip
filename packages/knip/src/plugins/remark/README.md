# Remark

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `remark-cli`

## Default configuration

```json
{
  "remark": {
    "config": ["package.json", ".remarkrc", ".remarkrc.json", ".remarkrc.{js,cjs,mjs}", ".remarkrc.{yml,yaml}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
