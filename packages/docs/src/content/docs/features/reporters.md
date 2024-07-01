---
title: Reporters & Preprocessors
---

## Built-in Reporters

Knip provides the following built-in reporters:

- `codeowners`
- `compact`
- `json`
- `junit`
- `markdown`
- `symbol` (default)

Example usage:

```sh
knip --reporter compact
```

### JSON

The built-in `json` reporter output is meant to be consumed by other tools. It
reports in JSON format with unused `files` and `issues` as an array with one
object per file structured like this:

```json
{
  "files": ["src/unused.ts"],
  "issues": [
    {
      "file": "package.json",
      "owners": ["@org/admin"],
      "dependencies": ["jquery", "moment"],
      "devDependencies": [],
      "unlisted": [{ "name": "react" }, { "name": "@org/unresolved" }],
      "exports": [],
      "types": [],
      "duplicates": []
    },
    {
      "file": "src/Registration.tsx",
      "owners": ["@org/owner"],
      "dependencies": [],
      "devDependencies": [],
      "binaries": [],
      "unresolved": [
        { "name": "./unresolved", "line": 8, "col": 23, "pos": 403 }
      ],
      "exports": [{ "name": "unusedExport", "line": 1, "col": 14, "pos": 13 }],
      "types": [
        { "name": "unusedEnum", "line": 3, "col": 13, "pos": 71 },
        { "name": "unusedType", "line": 8, "col": 14, "pos": 145 }
      ],
      "enumMembers": {
        "MyEnum": [
          { "name": "unusedMember", "line": 13, "col": 3, "pos": 167 },
          { "name": "unusedKey", "line": 15, "col": 3, "pos": 205 }
        ]
      },
      "classMembers": {
        "MyClass": [
          { "name": "unusedMember", "line": 40, "col": 3, "pos": 687 },
          { "name": "unusedSetter", "line": 61, "col": 14, "pos": 1071 }
        ]
      },
      "duplicates": ["Registration", "default"]
    }
  ]
}
```

The keys match the [reported issue types][1]. Example usage:

```sh
knip --reporter json
```

### JUnit

The built-in `junit` reporter output is meant to be saved to an XML file. This
can be achieved by providing the `path` value using `--reporter-options`. It
reports issues in JUnit XML format, which should be readable by CI tools such as
Bitbucket, Jenkins, etc. For example:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Knip report" tests="4" failures="4">
  <testsuite name="Unused files" tests="1" failures="1">
    <testcase tests="1" failures="1" name="Unused files" classname="src/unused.ts">
      <failure message="Unused files" type="Unused files">Unused files: src/unused.ts</failure>
    </testcase>
  </testsuite>
  <testsuite name="Unlisted dependencies" tests="2" failures="2">
    <testcase tests="1" failures="1" name="Unlisted dependencies" classname="src/index.ts">
      <failure message="Unlisted dependencies - unresolved" type="Unlisted dependencies">Unlisted dependencies: "unresolved" inside src/index.ts</failure>
    </testcase>
    <testcase tests="1" failures="1" name="Unlisted dependencies" classname="src/index.ts">
      <failure message="Unlisted dependencies - @org/unresolved" type="Unlisted dependencies">Unlisted dependencies: "@org/unresolved" inside src/index.ts</failure>
    </testcase>
  </testsuite>
  <testsuite name="Unresolved imports" tests="1" failures="1">
    <testcase tests="1" failures="1" name="Unresolved imports" classname="src/index.ts:8:23">
      <failure message="Unresolved imports - ./unresolved" type="Unresolved imports">Unresolved imports: "./unresolved" inside src/index.ts:8:23</failure>
    </testcase>
  </testsuite>
</testsuites>
```

Example usage:

```sh
knip --reporter json --reporter-options '{"path": "/test-results/knip.xml"}'
```

### Markdown

The built-in `markdown` reporter output is meant to be saved to a Markdown file.
This allows following the changes in issues over time. It reports issues in
Markdown tables separated by issue types as headings, for example:

```md
# Knip report

## Unused files (1)

- src/unused.ts

## Unlisted dependencies (2)

| Name            | Location          | Severity |
| :-------------- | :---------------- | :------- |
| unresolved      | src/index.ts:8:23 | error    |
| @org/unresolved | src/index.ts:9:23 | error    |

## Unresolved imports (1)

| Name         | Location           | Severity |
| :----------- | :----------------- | :------- |
| ./unresolved | src/index.ts:10:12 | error    |
```

## Custom Reporters

When the provided built-in reporters are not quite sufficient, a custom local
reporter can be implemented or an external reporter can be used. Multiple
reporters can be used at once by repeating the `--reporter` argument.

The results are passed to the function from its default export and can be used
to write issues to `stdout`, a JSON or CSV file, or sent to a service. It
supports a local JavaScript or TypeScript file or an external dependency.

### Local

The default export of the reporter should be a function with this interface:

```ts
type Reporter = async (options: ReporterOptions): void;

type ReporterOptions = {
  report: Report;
  issues: Issues;
  configurationHints: ConfigurationHints;
  noConfigHints: boolean;
  cwd: string;
  isProduction: boolean;
  isShowProgress: boolean;
  options: string;
};
```

The data can then be used to write issues to `stdout`, a JSON or CSV file, or
sent to a service.

Here's a most minimal reporter example:

```ts title="./my-reporter.ts"
import type { Reporter } from 'knip';

const reporter: Reporter = function (options) {
  console.log(options.issues);
  console.log(options.counters);
};

export default reporter;
```

Example usage:

```sh
knip --reporter ./my-reporter.ts
```

### External

Pass `--reporter [pkg-name]` to use an external reporter. The default exported
function of the `main` script (default: `index.js`) will be invoked with the
`ReporterOptions`, just like a local reporter.

## Preprocessors

A preprocessor is a function that receives the results and should return data in
the same shape/structure (unless you pass it to only your own reporter). Just
like reporters, use e.g. `--preprocessor ./my-preprocessor` from the command
line (can be repeated).

The default export of the preprocessor should be a function with this interface:

```ts
type Preprocessor = async (options: ReporterOptions) => ReporterOptions;
```

Like reporters, you can use local JavaScript or TypeScript files and external
npm packages as preprocessors.

Example preprocessor:

```ts title="./preprocess.ts"
import type { Preprocessor } from 'knip';

const preprocess: Preprocessor = function (options) {
  // modify options.issues and options.counters
  return options;
};

export default preprocess;
```

Example usage:

```sh
knip --preprocessor ./preprocess.ts
```

[1]: ../reference/issue-types.md
