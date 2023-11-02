# npm-package-json-lint

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `npm-package-json-lint`

## Default configuration

```json
{
  "npm-package-json-lint": {
    "config": [".npmpackagejsonlintrc.json", "npmpackagejsonlint.config.js", "package.json"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
