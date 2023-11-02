# Playwright for components

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `/^@playwright\/experimental-ct-/`

## Default configuration

```json
{
  "playwright-ct": {
    "config": ["playwright-ct.config.{js,ts}", "playwright/index.{js,ts,jsx,tsx}"],
    "entry": ["**/*.@(spec|test).?(c|m)[jt]s?(x)"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
