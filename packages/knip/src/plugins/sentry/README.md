# Sentry

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `/^@sentry\//`

## Default configuration

```json
{
  "sentry": {
    "entry": ["sentry.{client,server,edge}.config.{js,ts}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
