import { initIssues, initCounters } from './issues/initializers.js';
import { relative } from './util/path.js';
import type { ConfigurationHint, Issue, Rules } from './types/issues.js';

type Filters = Partial<{
  dir: string;
}>;

type IssueCollectorOptions = {
  cwd: string;
  rules: Rules;
  filters: Filters;
};

// TODO Fix dirty check
function objectInSet(set: Set<ConfigurationHint>, obj: ConfigurationHint) {
  const objJSON = JSON.stringify(obj);
  return Array.from(set).some(item => JSON.stringify(item) === objJSON);
}

/**
 * - Collects issues and counts them
 * - Hands them out, to be consumed by reporters
 */
export class IssueCollector {
  private cwd: string;
  private rules: Rules;
  private filters: Filters;
  private issues = initIssues();
  private counters = initCounters();
  private referencedFiles: Set<string> = new Set();
  private configurationHints: Set<ConfigurationHint> = new Set();

  constructor({ cwd, rules, filters }: IssueCollectorOptions) {
    this.cwd = cwd;
    this.rules = rules;
    this.filters = filters;
  }

  addFileCounts({ processed, unused }: { processed: number; unused: number }) {
    this.counters.processed += processed;
    this.counters.total += processed + unused;
  }

  addFilesIssues(filePaths: string[]) {
    filePaths.forEach(filePath => {
      if (this.filters.dir && !filePath.startsWith(this.filters.dir + '/')) return;
      if (this.referencedFiles.has(filePath)) return;
      this.issues.files.add(filePath);
      this.counters.files++;
      this.counters.processed++;
    });
  }

  addIssue(issue: Issue) {
    if (this.filters.dir && !issue.filePath.startsWith(this.filters.dir + '/')) return;
    const key = relative(this.cwd, issue.filePath);
    issue.severity = this.rules[issue.type];
    this.issues[issue.type][key] = this.issues[issue.type][key] ?? {};
    if (!this.issues[issue.type][key][issue.symbol]) {
      this.issues[issue.type][key][issue.symbol] = issue;
      this.counters[issue.type]++;
    }
  }

  addConfigurationHint(issue: ConfigurationHint) {
    if (!objectInSet(this.configurationHints, issue)) {
      this.configurationHints.add(issue);
    }
  }

  getIssues() {
    return {
      issues: this.issues,
      counters: this.counters,
      configurationHints: this.configurationHints,
    };
  }
}
