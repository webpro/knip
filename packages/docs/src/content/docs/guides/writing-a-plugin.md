---
title: Writing A Plugin
---

## Introduction

In this tutorial we are going to write a new plugin for Knip. We'll be using
"Cool Linter" as the example tool we create the plugin for.

This document also serves as a reference to each of the exported values.

## Scaffold a new plugin

The easiest way to create a new plugin is to use the `create-plugin` script:

```sh
cd packages/knip
npm run create-plugin -- --name cool-linter
```

This adds source files, and a test and fixtures to get you started. The main
source file contains comments for some guidance as well.

If there's a plugin similar to what you need, by all means, copy from that
plugin implementation, tests and fixtures.

## Exports

This section describes each exported value that the generator has pre-defined at
`src/plugins/cool-linter/index.ts`. In many cases, writing a plugin is much like
filling in the blanks. Everything that is not used or empty can be removed.

### `NAME`

The name of the plugin to display in the [list of plugins][1] and in debug
output.

```ts title="src/plugins/cool-linter/index.ts"
const NAME = 'Cool Linter';
```

### `ENABLERS`

An array of strings and/or regular expressions that should match one or more
dependencies so the `isEnabled` function can determine whether the plugin should
be enabled or not. This is often a single package name, for example:

```ts title="src/plugins/cool-linter/index.ts"
const ENABLERS = ['cool-linter'];
```

### `isEnabled`

This function can be fairly straightforward with the `hasDependency` helper:

```ts title="src/plugins/cool-linter/index.ts"
const isEnabled = ({ dependencies }) => hasDependency(dependencies, ENABLERS);
```

This will check whether a match is found in the `dependencies` or
`devDependencies` in `package.json`. When the dependency is listed in
`package.json`, the plugin will be enabled.

#### Notes

In some cases, you might want to check for something else, such as the presence
of a file or a value in `package.json`. You can implement any (`async`) function
and return a boolean. Here is the [function signature for
`IsPluginEnabledCallback`][2].

### `CONFIG_FILE_PATTERNS`

The [Plugins page][3] describes `config` files. Their default value is what we
define as `CONFIG_FILE_PATTERNS` here in the plugin.

:::tip

You only need `CONFIG_FILE_PATTERNS` and implement the `findDependencies`
function if:

- At least one of the configuration files is JSON or YAML, OR
- The configuration references dependencies not using regular `require` or
  `import` statements

:::

This means we need to define and export this variable, so Knip can find the
configuration file:

```json title="cool-linter.config.json"
{
  "addons": ["@cool-linter/awesome-addon"],
  "plugins": ["@cool-linter/priority-plugin"]
}
```

And here's how we can define this config file pattern from the plugin:

```ts title="src/plugins/cool-linter/index.ts"
const CONFIG_FILE_PATTERNS = ['cool-linter.config.{js,json}'];
```

For each configuration file with a match in `CONFIG_FILE_PATTERNS`, the
`findDependencies` function will be invoked with the file path as the first
argument. There should usually be just one match (per workspace).

#### Note

Configuration files may end with `.js` or `.ts`, such as
`cool-linter.config.js`. The default export of these files will be handled by
the `findDependencies` function we will define in our plugin (the plugin loads
the file dynamically). Since these files may also `require` or `import`
dependencies, Knip also automatically adds them to [`ENTRY_FILE_PATTERNS`][4]
(for static analysis). Also see [Plugins → Bringing It All Together][5] for an
example.

### `findDependencies`

The `findDependencies` function should do three things:

1. Load the provided configuration file.
2. Find dependencies referenced in this configuration.
3. Return an array of the dependencies.

Let's look at an example. Say you're using the Cool Linter tool in your project.
Running Knip results in some false positives:

```sh
$ knip
Unused dependencies (2)
@cool-linter/awesome-addon
@cool-linter/priority-plugin
```

This is incorrect, since you have `cool-linter.config.json` that references
those dependencies!

This is where our new plugin comes in. Knip will look for
`cool-linter.config.json`, and the exported `findDependencies` function will be
invoked with the full path to the file.

```ts title="src/plugins/cool-linter/index.ts"
const findCoolLinterDependencies: GenericPluginCallback =
  async configFilePath => {
    // 1. Load the configuration
    const config = await load(configFilePath);

    // 2. Grab the dependencies from the object
    const addons = config?.addons ?? [];
    const plugins = config?.plugins ?? [];

    // 3. Return the results
    return [...addons, ...plugins];
  };

const findDependencies = timerify(findCoolLinterDependencies);
```

#### Notes

- Knip provides the `load` helper to load most JavaScript, TypeScript, JSON and
  YAML files.
- The exported function should be wrapped with `timerify`, so Knip can gather
  metrics when running `knip --performance`. By default it just returns the
  function without any overhead.

### `ENTRY_FILE_PATTERNS`

Entry files are added to the set of `entry` files of the source code. This means
that their imports and exports will be resolved, recursively. Plugins include
various types of entry files:

- Plugins related to test frameworks should include files such as `*.spec.js`.
- Plugins for frameworks such as Next.js or Svelte should include files like
  `pages/**/*.ts` or `routes/**/*.svelte`.
- Another example is Storybook which includes entry files like
  `**/*.stories.js`.
- The Next.js plugin does not need `CONFIG_FILE_PATTERNS` with
  `findPluginDependencies`. Yet it does have `next.config.{js,ts}` in
  `ENTRY_FILE_PATTERNS`, since that file may `require` or `import` dependencies.

In [production mode][6], these files are not included. They are included only in
the default mode.

Cool Linter does not require such files, so we can remove them from our plugin.

### `PRODUCTION_ENTRY_FILE_PATTERNS`

Most files targeted by plugins are files related to test and development, such
as test and configuration files. They usually depend on `devDependencies`.
However, some plugins target production files, such as Next.js, Gatsby and
Remix. Here's a shortened example from the Remix plugin:

```ts title="src/plugins/cool-linter/index.ts"
const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'app/root.tsx',
  'app/entry.{client,server}.{js,jsx,ts,tsx}',
  'app/routes/**/*.{js,ts,tsx}',
  'server.{js,ts}',
];
```

In [production mode][6], these files are included (while `ENTRY_FILE_PATTERNS`
are not). They're also included in the default mode.

Cool Linter does not require this export, so we can delete this from our plugin.

### `PROJECT_FILE_PATTERNS`

Sometimes the source files targeted with `project` patterns may not include the
files related to the tool of the plugin. For instance, Storybook files are in a
`.storybook` directory, which may not be found by the default glob patterns. So
here they can be explicitly added, regardless of the user's `project` files
configuration.

```ts title="src/plugins/cool-linter/index.ts"
const PROJECT_FILE_PATTERNS = ['.storybook/**/*.{js,jsx,ts,tsx}'];
```

Most plugins don't need to set this, since the [default configuration for
`project`][7] already covers these files.

Cool Linter does not require this export, so we can delete this from our plugin.

## Tests

Let's update the tests to verify our plugin implementation is working correctly.

1. Let's save the example `cool-linter.config.json` in the fixtures directory.
   Create the file in your IDE, and save it at
   `fixtures/plugins/cool-linter/cool-linter.config.json`.

2. Update the test:

   ```ts title="test/plugins/cool-linter.test.ts"
   test('Find dependencies in cool-linter configuration (json)', async () => {
     const configFilePath = join(cwd, 'cool-linter.config.json');
     const dependencies = await coolLinter.findDependencies(configFilePath);
     assert.deepEqual(dependencies, [
       '@cool-linter/awesome-addon',
       '@cool-linter/priority-plugin',
     ]);
   });
   ```

   This verifies the dependencies in `cool-linter.config.json` are correctly
   returned to the Knip program.

3. Run the test:

   ```sh
   npx tsx test/plugins/cool-linter.test.ts
   ```

If all went well, the test passes and you created a new plugin for Knip! 🆕 🎉

## Documentation

The documentation website takes care of generating the [plugin list and the
individual plugin pages][1].

## Wrapping Up

Thanks for reading. If you have been following this guide to create a new
plugin, this might be the right time to open a pull request!

[1]: ../reference/plugins.md
[2]: https://github.com/webpro/knip/blob/v4/packages/knip/src/types/plugins.ts
[3]: ../explanations/plugins.md
[4]: #entry_file_patterns
[5]: ../explanations/plugins.md#bringing-it-all-together
[6]: ../features/production-mode.md
[7]: ../overview/configuration.md#defaults
