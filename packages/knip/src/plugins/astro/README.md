# Astro

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `astro`

## Default configuration

```json
{
  "astro": {
    "entry": [
      "astro.config.{js,cjs,mjs,ts}",
      "src/content/config.ts",
      "src/pages/**/*.{astro,mdx,js,ts}",
      "src/content/**/*.mdx"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
