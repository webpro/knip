# Next.js

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `next`

## Default configuration

```json
{
  "next": {
    "entry": [
      "next.config.{js,ts,cjs,mjs}",
      "middleware.{js,ts}",
      "app/**/route.{js,ts}",
      "app/**/{error,layout,loading,not-found,page,template}.{js,jsx,ts,tsx}",
      "instrumentation.{js,ts}",
      "app/{manifest,sitemap,robots}.{js,ts}",
      "app/**/{icon,apple-icon}.{js,ts,tsx}",
      "app/**/{opengraph,twitter}-image.{js,ts,tsx}",
      "pages/**/*.{js,jsx,ts,tsx}",
      "src/middleware.{js,ts}",
      "src/app/**/route.{js,ts}",
      "src/app/**/{error,layout,loading,not-found,page,template}.{js,jsx,ts,tsx}",
      "src/instrumentation.{js,ts}",
      "src/app/{manifest,sitemap,robots}.{js,ts}",
      "src/app/**/{icon,apple-icon}.{js,ts,tsx}",
      "src/app/**/{opengraph,twitter}-image.{js,ts,tsx}",
      "src/pages/**/*.{js,jsx,ts,tsx}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
