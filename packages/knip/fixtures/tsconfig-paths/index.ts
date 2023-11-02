import { a } from '@alias/a';
import { pkg } from '@internal';
import * as Unknown from '@unknown';
import { unprefixed } from 'unprefixed';
import unresolved from 'unresolved/dir';

const LazyComponent = lazy(async () => ({
  default: (await import('@/components/MyComponent')).MyComponent,
}));

const IndexComponent = lazy(async () => ({
  default: (await import('./components/IndexComponent')).IndexComponent,
}));

a;
pkg;
unprefixed;
