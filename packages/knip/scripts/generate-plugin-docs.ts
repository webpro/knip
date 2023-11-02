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

    const defaultEnableText =
      'This plugin is enabled when any of the following package names and/or regular expressions has a match in `dependencies` or `devDependencies`:';

    const enableText =
      Array.isArray(ENABLERS) && ENABLERS.length > 0
        ? `${defaultEnableText}\n\n` + ENABLERS.map(enabler => `- \`${enabler}\``).join(EOL)
        : typeof ENABLERS === 'string'
        ? ENABLERS
        : 'N/A';

    const docs = docTemplate
      .replace(/# PLUGIN_TITLE/, `# ${NAME}`)
      .replace(/PLUGIN_ENABLER/, enableText)
      .replace(/(```json)[\s\S]*(```)/m, `$1${EOL}${JSON.stringify({ [pluginName]: defaults }, null, 2)}${EOL}$2`);

    console.log(`Writing README.md for ${NAME} plugin`);

    const filePath = path.join(pluginDir, 'README.md');
    await fs.writeFile(filePath, docs);

    plugins.push([NAME, pluginName]);
  }
}

const indexContents = await fs.readFile(indexFilePath);

plugins.sort((a, b) => (a[1] < b[1] ? -1 : 1));

const references = plugins.map(([pluginTitle, pluginDir]) => `- [${pluginTitle}][plugin-${pluginDir}]`).join(EOL);
const updateReferences = text => text.replace(/(- \[[^\]]+\]\[plugin-[^\]]+\]\s)+/m, references + EOL);

const definitions = plugins.map(([, pluginDir]) => `[plugin-${pluginDir}]: ./src/plugins/${pluginDir}`).join(EOL);
const updateDefinitions = text => text.replace(/(\[plugin-[^\]]+\]: \.\/src\/plugins\/.+\s)+/m, definitions + EOL);

console.log('Updating plugin index in README.md');

await fs.writeFile(indexFilePath, updateDefinitions(updateReferences(indexContents.toString())));
