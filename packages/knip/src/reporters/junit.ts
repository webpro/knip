import fs from 'node:fs';
import { XMLBuilder } from 'fast-xml-parser';
import { resolve, dirname, toRelative } from '../util/path.js';
import { getTitle } from './util.js';
import type { ReporterOptions, IssueSet, IssueRecords, Issue } from '../types/issues.js';
import type { Entries } from 'type-fest';

interface IssuesEntry {
  entry: string;
  issues: Issue[];
}

type ExtraReporterOptions = {
  path?: string;
};

type Failure = {
  '@_message': string;
  '@_type': string;
  '#text': string;
};

type TestCase = {
  '@_tests': number;
  '@_failures': number;
  '@_name': string;
  '@_classname': string;
  failure: Failure;
};

type TestSuite = {
  '@_name': string;
  '@_tests': number;
  '@_failures': number;
  testcase: TestCase[];
};

export default ({ report, issues, counters, options }: ReporterOptions) => {
  let totalIssues = 0;
  let testSuite: TestSuite[] = [];

  for (const [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (isReportType) {
      const title = getTitle(reportType);
      const count = counters[reportType];
      const isSet = issues[reportType] instanceof Set;
      const issuesForType = isSet
        ? Array.from(issues[reportType] as IssueSet)
        : Object.entries(issues[reportType] as IssueRecords).map(([entry, errors]) => {
            const items = Object.values(errors);
            const issues = items.flatMap(item => (item.symbols ? item.symbols : { ...item }));
            return { entry, issues };
          });

      if (issuesForType.length > 0) {
        let testCase: TestCase[] = [];
        if (isSet) {
          const setTestCases = (issuesForType as string[]).map(issue => ({
            '@_tests': 1,
            '@_failures': 1,
            '@_name': title,
            '@_classname': toRelative(issue),
            failure: {
              '@_message': title,
              '@_type': title,
              '#text': `${title}: ${toRelative(issue)}`,
            },
          }));
          testCase.push(...setTestCases);
        } else {
          const entriesTestCases = (issuesForType as IssuesEntry[]).flatMap(typeIssues =>
            typeIssues.issues.map(issue => {
              let entry = typeIssues.entry;
              if ('line' in issue && 'col' in issue) {
                entry = `${typeIssues.entry}:${issue.line}:${issue.col}`;
              }
              return {
                '@_tests': 1,
                '@_failures': 1,
                '@_name': title,
                '@_classname': entry,
                failure: {
                  '@_message': `${title} - ${issue.symbol}`,
                  '@_type': title,
                  '#text': `${title}: "${issue.symbol}" inside ${entry}`,
                },
              };
            })
          );
          testCase.push(...entriesTestCases);
        }

        if (testCase.length > 0) {
          testSuite.push({
            '@_name': title,
            '@_tests': count,
            '@_failures': count,
            testcase: testCase,
          });

          totalIssues += count;
        }
      }
    }
  }

  if (totalIssues > 0) {
    let opts: ExtraReporterOptions = {};

    try {
      opts = options ? JSON.parse(options) : opts;
    } catch (err) {
      console.error('Error occured while parsing options:', err);
    }

    const xml = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      testsuites: {
        '@_name': 'Knip report',
        '@_tests': totalIssues,
        '@_failures': totalIssues,
        testsuite: testSuite,
      },
    };

    const builder = new XMLBuilder({
      attributeNamePrefix: '@_',
      format: true,
      processEntities: false,
      ignoreAttributes: false,
    });
    const outputXML = builder.build(xml);

    if (opts.path) {
      const dir = dirname(opts.path);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      try {
        fs.writeFileSync(resolve(opts.path), outputXML, 'utf-8');
        console.log('Knip results file successfully written.');
      } catch (err) {
        console.error('Error occured while writing knip results file: ', err);
      }
    } else {
      console.log(outputXML);
    }
  }
};
