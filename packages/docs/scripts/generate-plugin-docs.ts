import fs from 'node:fs/promises';
// eslint-disable-next-line n/no-restricted-import
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { u } from 'unist-builder';
import { base } from '../config.js';
import type { Plugin } from '../../knip/src/types/plugins.js';
import type { Root } from 'mdast';
import type { Node } from 'unist';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const referenceDocsDir = path.join(rootDir, 'src/content/docs/reference');
const knipDir = path.join(rootDir, '../../packages/knip');
const pluginsDir = path.join(knipDir, 'src/plugins');
const directories = await fs.opendir(pluginsDir);
const plugins = [];

const prettierConfigPath = path.join(rootDir, '.prettierrc.json');
const prettierOptions = await prettier.resolveConfig(prettierConfigPath);

const parseFragment = (text: string) => {
  const tree = unified().use(remarkParse).parse(text);
  return tree.children;
};

const writeTree = async (tree: Node, filePath: string) => {
  try {
    const file = await unified().run(tree);
    const markdown = unified()
      .use(remarkFrontmatter, ['yaml'])
      .use(remarkDirective)
      .use(remarkStringify, {
        bullet: '-',
      })
      .stringify(file as Root);

    const formattedMarkdown = await prettier.format(markdown, { ...prettierOptions, parser: 'markdown' });
    await fs.writeFile(filePath, formattedMarkdown);
  } catch (err) {
    console.error(err);
  }
};

for await (const dir of directories) {
  if (dir.isDirectory() && dir.name !== '_template') {
    const pluginName = dir.name;
    const pluginDir = path.join(pluginsDir, pluginName);
    const plugin: Plugin = (await import(path.join(pluginDir, 'index.ts'))).default;

    const {
      NAME,
      ENABLERS,
      CONFIG_FILE_PATTERNS: config,
      ENTRY_FILE_PATTERNS: entry,
      PRODUCTION_ENTRY_FILE_PATTERNS: production,
      PROJECT_FILE_PATTERNS: project,
    } = plugin;

    plugins.push([NAME, pluginName]);

    const frontmatter = u('yaml', `title: ${NAME}\nsidebar:\n  hidden: true`);

    const defaults: Record<string, string[]> = {};
    if (config && config.length > 0) defaults.config = config;
    if (entry && entry.length > 0) defaults.entry = entry;
    if (production && production.length > 0) defaults.entry = [...(defaults.entry ?? []), ...production];
    if (project && project.length > 0) defaults.project = project;

    const en =
      Array.isArray(ENABLERS) && ENABLERS.length > 0
        ? [
            ...parseFragment(
              "This plugin is enabled when there's a match in `dependencies` or `devDependencies` in `package.json`:"
            ),
            u(
              'list',
              ENABLERS.map((enabler: string | RegExp) =>
                u('listItem', [u('inlineCode', typeof enabler === 'string' ? enabler : enabler.source)])
              )
            ),
          ]
        : typeof ENABLERS === 'string'
          ? parseFragment(ENABLERS)
          : [u('paragraph', [u('text', 'N/A')])];

    const tree = u('root', [
      frontmatter,
      u('heading', { depth: 2 }, [u('text', 'Enabled')]),
      ...en,
      u('heading', { depth: 2 }, [u('text', 'Default configuration')]),
      u('code', {
        lang: 'json title="knip.json"', // TODO How to set attributes/properties/props properly?
        value: JSON.stringify({ [pluginName]: defaults }, null, 2),
      }),
      ...parseFragment('Custom `config` or `entry` configuration overrides the defaults, they are not merged.'),
    ]);

    console.log(`Writing ${pluginName} docs to plugins/${pluginName}.md`);
    await writeTree(tree, path.join(referenceDocsDir, `plugins/${pluginName}.md`));
  }
}

plugins.sort((a, b) => (a[1] < b[1] ? -1 : 1));

const frontmatter = u('yaml', `title: Plugins\ntableOfContents: false`);

const tree = u('root', [
  frontmatter,
  u('containerDirective', { name: 'section{.columns.min200}' }, [
    u(
      'list',
      { spread: false, ordered: false },
      plugins.map(plugin =>
        u('listItem', [
          // @ts-expect-error reusable
          u('link', { title: plugin[0], url: (base === '/' ? '' : base) + `/reference/plugins/${plugin[1]}` }, [
            u('text', plugin[0]),
          ]),
        ])
      )
    ),
    u('paragraph'),
  ]),
]);

console.log(`Writing plugin list to plugins.md`);
await writeTree(tree, path.join(referenceDocsDir, 'plugins.md'));
