import chalk from 'chalk';
import EasyTable from 'easy-table';
import { ROOT_WORKSPACE_NAME } from '../constants.js';
import { relative } from '../util/path.js';
import { getTitle, logTitle, logIssueSet, identity } from './util.js';
import type { Issue, ReporterOptions, IssueSet } from '../types/issues.js';
import type { Entries } from 'type-fest';

const TRUNCATE_WIDTH = 40;
const truncate = (text: string) => (text.length > TRUNCATE_WIDTH ? text.slice(0, TRUNCATE_WIDTH - 3) + '...' : text);

const logIssueRecord = (issues: Issue[]) => {
  const table = new EasyTable();
  issues.forEach(issue => {
    const print = issue.severity === 'warn' ? chalk.grey : identity;
    table.cell('symbol', print(issue.symbols ? truncate(issue.symbols.join(', ')) : issue.symbol));
    issue.parentSymbol && table.cell('parentSymbol', print(issue.parentSymbol));
    issue.symbolType && table.cell('symbolType', print(issue.symbolType));
    table.cell('filePath', print(relative(issue.filePath)));
    table.newRow();
  });
  console.log(table.sort(['filePath', 'parentSymbol', 'symbol']).print().trim());
};

export default ({ report, issues, configurationHints, noConfigHints, isShowProgress }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  let totalIssues = 0;

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = reportMultipleGroups && getTitle(reportType);
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.values(issues[reportType]).map(Object.values).flat();

      if (issuesForType.length > 0) {
        title && logTitle(title, issuesForType.length);
        if (isSet) {
          logIssueSet(issuesForType);
        } else {
          logIssueRecord(issuesForType);
        }
      }

      totalIssues = totalIssues + issuesForType.length;
    }
  }

  if (!noConfigHints && configurationHints.size > 0) {
    logTitle('Configuration issues', configurationHints.size);
    configurationHints.forEach(hint => {
      const { type, workspaceName, identifier } = hint;
      const message = `Unused item in ${type}`;
      const workspace = workspaceName && workspaceName !== ROOT_WORKSPACE_NAME ? ` (workspace: ${workspaceName})` : ``;
      console.warn(chalk.grey(`${message}${workspace}:`), identifier);
    });
  }

  if (totalIssues === 0 && isShowProgress) {
    console.log('✂️  Excellent, Knip found no issues.');
  }
};
