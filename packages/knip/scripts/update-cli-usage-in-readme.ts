import fs from 'node:fs/promises';
import { EOL } from 'node:os';
import path from 'node:path';
import { helpText } from '../src/util/cli-arguments.js';

const filePath = path.resolve('README.md');

const contents = await fs.readFile(filePath);

const replacement = EOL + '    ' + helpText.split(EOL).join(EOL + '    ');

const update = text =>
  text.replace(
    /(\$ npx knip --help)[\s\S]*More documentation and bug reports: https:\/\/github\.com\/webpro\/knip/m,
    `$1${replacement}`
  );

await fs.writeFile(filePath, update(contents.toString()));
