# husky

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `husky`

## Default configuration

```json
{
  "husky": {
    "config": [
      ".husky/prepare-commit-msg",
      ".husky/commit-msg",
      ".husky/pre-{applypatch,commit,merge-commit,push,rebase,receive}",
      ".husky/post-{checkout,commit,merge,rewrite}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
