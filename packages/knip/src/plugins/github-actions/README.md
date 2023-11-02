# GitHub Actions

## Enabled

This plugin is enabled when a `.yml` or `.yaml` file is found in the `.github/workflows` folder.

## Default configuration

```json
{
  "github-actions": {
    "config": [".github/workflows/*.{yml,yaml}", ".github/**/action.{yml,yaml}"]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
