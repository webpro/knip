# Stryker

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `@stryker-mutator/core`

## Default configuration

```json
{
  "stryker": {
    "config": ["?(.)stryker.{conf,config}.{js,mjs,cjs,json}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
