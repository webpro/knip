import { getTitle, logTitle, logIssueLine, logIssueSet } from './util.js';
import type { Issue, ReporterOptions, IssueSet, IssueRecords } from '../types/issues.js';
import type { Entries } from 'type-fest';

const logIssueRecord = (issues: Issue[]) => {
  const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
  sortedByFilePath.forEach(logIssueLine);
};

export default ({ report, issues, isShowProgress }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups && getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : reportType === 'duplicates'
        ? Object.values(issues[reportType]).flatMap(Object.values)
        : Object.values(issues[reportType] as IssueRecords).map(issues => {
            const items = Object.values(issues);
            return { ...items[0], symbols: items.map(issue => issue.symbol) };
          });

      if (issuesForType.length > 0) {
        title && logTitle(title, issuesForType.length);
        if (isSet) {
          logIssueSet(Array.from(issues[reportType] as IssueSet));
        } else {
          logIssueRecord(issuesForType);
        }
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
