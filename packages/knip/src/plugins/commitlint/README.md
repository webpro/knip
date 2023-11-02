# commitlint

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `@commitlint/cli`

## Default configuration

```json
{
  "commitlint": {
    "config": [
      ".commitlintrc",
      ".commitlintrc.{json,yaml,yml,js,cjs,ts,cts}",
      "commitlint.config.{js,cjs,ts,cts}",
      "package.json"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
