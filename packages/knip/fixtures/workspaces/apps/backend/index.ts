import defaultA, { usedExportFromLibA } from '@workspaces/shared';
import defaultB, { usedExportFromLibB } from '@workspaces/tools';
import { globby } from 'globby';
import yaml from 'js-yaml';

defaultA;
defaultB;
usedExportFromLibA;
usedExportFromLibB;
