import { ReporterOptions } from '../../src/types/issues';

export default function identity(value: ReporterOptions): ReporterOptions {
  return value;
}
