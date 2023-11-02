# Remix

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `/^@remix-run\//`

## Default configuration

```json
{
  "remix": {
    "entry": [
      "remix.config.js",
      "remix.init/index.js",
      "app/root.tsx",
      "app/entry.{client,server}.{js,jsx,ts,tsx}",
      "app/routes/**/*.{js,ts,tsx}",
      "server.{js,ts}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
