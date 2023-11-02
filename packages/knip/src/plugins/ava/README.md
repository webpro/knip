# Ava

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- `ava`

## Default configuration

```json
{
  "ava": {
    "config": ["ava.config.{js,cjs,mjs}", "package.json"],
    "entry": [
      "test.{js,cjs,mjs,ts}",
      "{src,source}/test.{js,cjs,mjs,ts}",
      "**/__tests__/**/*.{js,cjs,mjs,ts}",
      "**/*.spec.{js,cjs,mjs,ts}",
      "**/*.test.{js,cjs,mjs,ts}",
      "**/test-*.{js,cjs,mjs,ts}",
      "**/test/**/*.{js,cjs,mjs,ts}",
      "**/tests/**/*.{js,cjs,mjs,ts}",
      "!**/__tests__/**/__{helper,fixture}?(s)__/**/*",
      "!**/test?(s)/**/{helper,fixture}?(s)/**/*"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
