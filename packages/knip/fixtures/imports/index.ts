import './side-effects';
import { named as renamed } from './aliased-binding';
import defaultName1, { named as renamed2 } from './default-and-named-binding';
import defaultName2 from './default-identifier';
import { named as renamed3 } from './named-object-binding';

const fn = (_: any) => {};

const topLevel = await import('./top-level-await-import');
const { top } = await import('./top-level-await-import');

const dynamic = () => import('./dir/import-b').then(m => m.dynamic);

import('./top-level-side-effects-call');

async function main() {
  import('./side-effects-call');
  await import('./await-import-call');
  const { default: defaultName, identifier: renamedIdentifier, identifier2 } = await import('./object-bindings');
}

const dynamicImport = (value: string) => {
  return import(`./dir/${value}`);
};

const templateStringExternal = () => {
  return import(`./no-substitution-tpl-literal`);
};

const templateStringLiteral = () => {
  return import('./string-literal');
};

const templateStringInternal = () => {
  return import('./dir/mod');
};

function promiseAll() {
  return {
    async fn() {
      const [identifierA, { default: identifierB }] = await Promise.all([
        import('./import-a'),
        import('./dir/import-b'),
      ]);
    },
  };
}

(await import('./prop-access')).propAccess;

const { default: defaultName3, identifier: renamedIdentifier, identifier2 } = (await import('./dir/import-b'))['named'];

const defaultName4 = (await import('./default-prop-access')).default;

import('./promise-like').then(f => f).catch(err => err);

const [defaultName5, { default: renamedIdentifier2, namedC }] = await Promise.all([
  import('./import-a'),
  import('./import-c'),
]);

const child1 = fn(() => import('./import-c'));

export default fn({
  components: {
    child1,
    child2: () => import('./import-d'),
    child3: import('./import-e'),
  },
});
