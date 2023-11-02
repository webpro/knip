# Lefthook

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `lefthook`
- `@arkweid/lefthook`
- `@evilmartians/lefthook`

## Default configuration

```json
{
  "lefthook": {
    "config": [
      "lefthook.yml",
      ".git/hooks/prepare-commit-msg",
      ".git/hooks/commit-msg",
      ".git/hooks/pre-{applypatch,commit,merge-commit,push,rebase,receive}",
      ".git/hooks/post-{checkout,commit,merge,rewrite}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
