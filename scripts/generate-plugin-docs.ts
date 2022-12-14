import fs from 'node:fs/promises';
import { EOL } from 'node:os';
import path from 'node:path';

const pluginsDir = path.resolve('src/plugins');
const templateDir = path.resolve('src/plugins/_template');
const docTemplateFilePath = path.join(templateDir, 'README.md');
const docTemplate = String(await fs.readFile(docTemplateFilePath));
const indexFilePath = path.resolve('README.md');

const directories = await fs.opendir(pluginsDir);
const plugins = [];

for await (const dir of directories) {
  if (dir.isDirectory() && dir.name !== '_template') {
    const pluginName = dir.name;
    const pluginDir = path.join(pluginsDir, pluginName);
    const {
      NAME,
      ENABLERS,
      CONFIG_FILE_PATTERNS: config,
      ENTRY_FILE_PATTERNS: entry,
      PRODUCTION_ENTRY_FILE_PATTERNS: production,
      PROJECT_FILE_PATTERNS: project,
    } = await import(path.join(pluginDir, 'index.ts'));

    const defaults: Record<string, string[]> = {};
    if (config?.length > 0) defaults.config = config;
    if (entry?.length > 0) defaults.entry = entry;
    if (production?.length > 0) defaults.entry = [...(defaults.entry ?? []), ...production];
    if (project?.length > 0) defaults.project = project;

    const docs = docTemplate
      .replace(/# PLUGIN_TITLE/, `# ${NAME}`)
      .replace(/- PLUGIN_ENABLERS/, ENABLERS.map(enabler => `- \`${enabler}\``).join(EOL))
      .replace(/(```json)[\s\S]*(```)/m, `$1${EOL}${JSON.stringify({ [pluginName]: defaults }, null, 2)}${EOL}$2`);

    console.log(`Writing README.md for ${NAME} plugin`);

    const filePath = path.join(pluginDir, 'README.md');
    await fs.writeFile(filePath, docs);

    plugins.push([NAME, pluginName]);
  }
}

const indexContents = await fs.readFile(indexFilePath);

const replacement = plugins
  .sort((a, b) => (a[1] < b[1] ? -1 : 1))
  .map(([pluginTitle, pluginDir]) => `- [${pluginTitle}](./src/plugins/${pluginDir})`)
  .join(EOL);

const update = text => text.replace(/- \[Babel\][\s\S]*- \[Webpack\].*/m, replacement);

console.log('Updating plugin index in README.md');

await fs.writeFile(indexFilePath, update(indexContents.toString()));
