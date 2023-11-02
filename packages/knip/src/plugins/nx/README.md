# Nx

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `nx`
- `/^@nrwl\//`
- `/^@nx\//`

## Default configuration

```json
{
  "nx": {
    "config": ["project.json", "{apps,libs}/**/project.json"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
