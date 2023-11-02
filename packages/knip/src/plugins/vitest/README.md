# Vitest

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `vitest`

## Default configuration

```json
{
  "vitest": {
    "config": ["vitest.config.ts", "vitest.{workspace,projects}.{ts,js,json}"],
    "entry": ["**/*.{test,spec}.?(c|m)[jt]s?(x)"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
