# lint-staged

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `lint-staged`

## Default configuration

```json
{
  "lint-staged": {
    "config": [
      ".lintstagedrc",
      ".lintstagedrc.json",
      ".lintstagedrc.{yml,yaml}",
      ".lintstagedrc.{js,mjs,cjs}",
      "lint-staged.config.{js,mjs,cjs}",
      "package.json"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
