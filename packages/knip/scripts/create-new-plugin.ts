import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from '../src/util/parseArgs.js';

const {
  values: { name },
} = parseArgs({
  options: {
    name: { type: 'string' },
  },
});

if (!name) {
  console.error('Usage: npm run create-plugin -- --name [name]');
  process.exit(1);
}

if (/[^a-z_-]/.test(name)) {
  console.error('Name must contain only lowercased letters, dashes and underscores (you can adjust the title later)');
  process.exit(1);
}

const toCamelCase = (name: string) =>
  name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

const cwd = process.cwd();
const pluginsDir = path.join(cwd, 'src/plugins');
const templateDir = path.join(pluginsDir, '_template');
const newPluginDir = path.join(pluginsDir, name);
const pluginsBarrelFilePath = path.join(pluginsDir, 'index.ts');
const schemaFilePath = path.join(cwd, 'schema.json');
const pluginTestsDir = path.join(cwd, 'test/plugins');
const validatorFilePath = path.join(cwd, 'src/ConfigurationValidator.ts');
const pluginTestTemplateFilePath = path.join(pluginTestsDir, '_template.test.ts');
const pluginTestFilePath = path.join(pluginTestsDir, `${name}.test.ts`);
const pluginTestFixturesDir = path.join(cwd, 'fixtures/plugins');
const pluginTestFixtureTemplateDir = path.join(pluginTestFixturesDir, '_template');
const pluginTestFixturePluginDir = path.join(pluginTestFixturesDir, name);
const camelCasedName = toCamelCase(name);

const relative = to => path.relative(cwd, to);

await fs.cp(templateDir, newPluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

const barrelFile = String(await fs.readFile(pluginsBarrelFilePath));
await fs.writeFile(pluginsBarrelFilePath, barrelFile + `export * as ${camelCasedName} from './${name}/index.js';`);

const validatorContent = String(await fs.readFile(validatorFilePath));
const pluginsPrefix = 'const pluginsSchema = z.object({';
const pluginsReplacement = `${pluginsPrefix}\n'${name}': pluginSchema,`;
await fs.writeFile(validatorFilePath, validatorContent.replace(pluginsPrefix, pluginsReplacement));

await fs.cp(pluginTestFixtureTemplateDir, pluginTestFixturePluginDir, {
  recursive: true,
  errorOnExist: true,
  force: false,
});

const testFileTemplate = String(await fs.readFile(pluginTestTemplateFilePath));
await fs.writeFile(
  pluginTestFilePath,
  testFileTemplate.replaceAll('__PLUGIN_CAMELCASED_NAME__', camelCasedName).replaceAll('_template', name)
);

const { default: schema } = await import(schemaFilePath);
const { plugins } = schema.definitions;
const { properties } = plugins;

properties[name] = {
  title: `${name} plugin configuration (https://github.com/webpro/knip/blob/main/src/plugins/${name}/README.md)`,
  $ref: '#/definitions/plugin',
};

plugins.properties = Object.keys(properties)
  .sort()
  .reduce((props, key) => ({ ...props, [key]: properties[key] }), {});

await fs.writeFile(schemaFilePath, JSON.stringify(schema, null, 2));

console.log(`- Created new plugin in ${relative(newPluginDir)}`);
console.log(`- Updated ${relative(pluginsBarrelFilePath)} and ${relative(schemaFilePath)}`);
console.log(`- Created a test file at ${relative(pluginTestFilePath)}`);
console.log('- Documentation is at https://github.com/webpro/knip/blob/main/docs/writing-a-plugin.md');
