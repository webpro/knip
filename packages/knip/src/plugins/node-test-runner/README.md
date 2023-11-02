# Node.js Test Runner

## Enabled

This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies`
or `devDependencies`:

- \`\`

## Default configuration

```json
{
  "node-test-runner": {
    "entry": [
      "**/test.{js,cjs,mjs}",
      "**/test-*.{js,cjs,mjs}",
      "**/*{.,-,_}test.{js,cjs,mjs}",
      "**/test/**/*.{js,cjs,mjs}"
    ]
  }
}
```

Also see [Knip plugins][1] for more information about plugins.

[1]: https://github.com/webpro/knip/blob/main/README.md#plugins
