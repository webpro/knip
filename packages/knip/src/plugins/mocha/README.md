# Mocha

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `mocha`

## Default configuration

```json
{
  "mocha": {
    "config": [".mocharc.{js,cjs,json,jsonc,yml,yaml}", "package.json"],
    "entry": ["**/test/*.{js,cjs,mjs}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
