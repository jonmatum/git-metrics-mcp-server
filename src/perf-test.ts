import { runGitCommand, validateRepoPath, parseCommitData } from './git-metrics.js';
import { resolve } from 'path';

const REPO = process.argv[2] || process.cwd();

console.log(`Testing performance on: ${REPO}`);

validateRepoPath(REPO);

const tests = [
  {
    name: 'Commit count',
    cmd: 'git rev-list --count HEAD'
  },
  {
    name: 'Get 1000 commits with stats',
    cmd: 'git log --since="2020-01-01" -1000 --pretty=format:"%ad|%H" --date=short --numstat'
  },
  {
    name: 'Get file churn (1000 commits)',
    cmd: 'git log --since="2020-01-01" -1000 --name-only --pretty=format:'
  },
  {
    name: 'Get author metrics (1000 commits)',
    cmd: 'git log --since="2020-01-01" -1000 --pretty=format:"%an|%ae" --numstat'
  }
];

for (const test of tests) {
  const start = Date.now();
  try {
    const output = runGitCommand(REPO, test.cmd);
    const duration = Date.now() - start;
    const size = Buffer.byteLength(output, 'utf8');
    console.log(`✓ ${test.name}: ${duration}ms (${(size / 1024).toFixed(2)} KB)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    console.log(`✗ ${test.name}: ${duration}ms - ${error.message}`);
  }
}

// Test parsing performance
const start = Date.now();
const output = runGitCommand(REPO, 'git log --since="2020-01-01" -1000 --pretty=format:"%ad|%H" --date=short --numstat');
const parseStart = Date.now();
const commits = parseCommitData(output);
const parseDuration = Date.now() - parseStart;
console.log(`✓ Parse ${commits.length} commits: ${parseDuration}ms`);
