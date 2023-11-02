# Svelte

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `svelte`

## Default configuration

```json
{
  "svelte": {
    "entry": [
      "svelte.config.js",
      "vite.config.ts",
      "src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}"
    ],
    "project": ["src/**/*.{js,ts,svelte}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
