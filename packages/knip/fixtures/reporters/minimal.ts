import type { ReporterOptions, IssueSet, IssueRecords } from '../../src/types/issues.js';
import type { Entries } from 'type-fest';

export default ({ report, issues }: ReporterOptions) => {
  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : reportType === 'duplicates'
        ? Object.values(issues[reportType]).map(Object.values).flat()
        : Object.values(issues[reportType] as IssueRecords);

      console.log(reportType, issuesForType.length);
    }
  }
};
