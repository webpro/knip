import { $ } from 'execa';

await $({ stdio: 'inherit' })`c8 node hydrate.js`;
