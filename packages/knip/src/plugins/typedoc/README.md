# TypeDoc

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `typedoc`

## Default configuration

```json
{
  "typedoc": {
    "config": [
      "typedoc.{js,cjs,json,jsonc}",
      "typedoc.config.{js,cjs}",
      ".config/typedoc.{js,cjs,json,jsonc}",
      ".config/typedoc.config.{js,cjs}",
      "package.json",
      "tsconfig.json"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
