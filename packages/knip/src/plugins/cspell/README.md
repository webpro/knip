# cspell

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `cspell`

## Default configuration

```json
{
  "cspell": {
    "config": ["cspell.config.{js,cjs,json,yaml,yml}", "cspell.{json,yaml,yml}", ".c{s,S}pell.json", "cSpell.json"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
