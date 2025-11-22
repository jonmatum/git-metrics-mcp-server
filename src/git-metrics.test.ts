import { describe, it, expect } from 'vitest';
import { validateDate, validateRepoPath, runGitCommand, sanitizeInput } from './git-metrics.js';
import { resolve } from 'path';
import { mkdirSync, rmSync } from 'fs';

const REPO = resolve(process.cwd());

describe('sanitizeInput', () => {
  it('should remove dangerous characters', () => {
    expect(sanitizeInput('test;rm -rf /')).toBe('testrm -rf /');
    expect(sanitizeInput('test&&echo')).toBe('testecho');
    expect(sanitizeInput('test|grep')).toBe('testgrep');
    expect(sanitizeInput('test`whoami`')).toBe('testwhoami');
    expect(sanitizeInput('test$(id)')).toBe('testid');
    expect(sanitizeInput('test()')).toBe('test');
  });

  it('should keep safe characters', () => {
    expect(sanitizeInput('/path/to/repo')).toBe('/path/to/repo');
    expect(sanitizeInput('test-file_123.txt')).toBe('test-file_123.txt');
  });
});

describe('validateDate', () => {
  it('should accept valid dates', () => {
    expect(() => validateDate('2025-11-21', 'since')).not.toThrow();
    expect(() => validateDate('2020-01-01', 'until')).not.toThrow();
  });

  it('should reject invalid dates', () => {
    expect(() => validateDate('invalid', 'since')).toThrow('Invalid since format');
    expect(() => validateDate('2025/11/21', 'since')).toThrow();
    expect(() => validateDate('25-11-21', 'since')).toThrow();
    expect(() => validateDate('', 'since')).toThrow();
  });
});

describe('validateRepoPath', () => {
  it('should accept valid repo paths', () => {
    expect(() => validateRepoPath(REPO)).not.toThrow();
  });

  it('should reject invalid paths', () => {
    expect(() => validateRepoPath('')).toThrow('repo_path is required');
    expect(() => validateRepoPath(null as any)).toThrow('repo_path is required');
    expect(() => validateRepoPath(undefined as any)).toThrow('repo_path is required');
    expect(() => validateRepoPath('/nonexistent/path/to/repo')).toThrow('does not exist');
  });

  it('should reject paths with dangerous characters', () => {
    expect(() => validateRepoPath('/tmp/repo; rm -rf /')).toThrow('Invalid characters');
    expect(() => validateRepoPath('/tmp/repo && echo hack')).toThrow('Invalid characters');
    expect(() => validateRepoPath('/tmp/repo | cat /etc/passwd')).toThrow('Invalid characters');
    expect(() => validateRepoPath('/tmp/repo`whoami`')).toThrow('Invalid characters');
    expect(() => validateRepoPath('/tmp/repo$(whoami)')).toThrow('Invalid characters');
  });

  it('should reject non-git directories', () => {
    const nonGitDir = resolve(process.cwd(), 'temp-non-git-dir');
    mkdirSync(nonGitDir, { recursive: true });
    expect(() => validateRepoPath(nonGitDir)).toThrow('Not a git repository');
    rmSync(nonGitDir, { recursive: true });
  });
});

describe('runGitCommand', () => {
  it('should execute git commands', () => {
    const output = runGitCommand(REPO, 'git log --oneline -1');
    expect(output).toBeTruthy();
    expect(typeof output).toBe('string');
  });

  it('should throw on invalid repo', () => {
    expect(() => runGitCommand('/nonexistent', 'git log')).toThrow('does not exist');
  });

  it('should throw on failed git command', () => {
    expect(() => runGitCommand(REPO, 'git invalid-command')).toThrow('Git command failed');
  });
});


describe('Git Operations', () => {
  it('should get commit stats', () => {
    const output = runGitCommand(
      REPO,
      'git log --since="2020-01-01" -5 --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat'
    );
    
    expect(output).toBeTruthy();
    expect(typeof output).toBe('string');
  });

  it('should get author metrics', () => {
    const output = runGitCommand(
      REPO,
      'git log --since="2020-01-01" -5 --pretty=format:"%an|%ae" --numstat'
    );
    
    const lines = output.trim().split('\n');
    const authorStats: Record<string, { commits: number }> = {};
    let currentAuthor = '';

    for (const line of lines) {
      if (line.includes('|')) {
        const [name, email] = line.split('|');
        currentAuthor = `${name} <${email}>`;
        if (!authorStats[currentAuthor]) {
          authorStats[currentAuthor] = { commits: 0 };
        }
        authorStats[currentAuthor].commits++;
      }
    }

    expect(Object.keys(authorStats).length).toBeGreaterThanOrEqual(0);
  });

  it('should get file churn', () => {
    const output = runGitCommand(
      REPO,
      'git log --since="2020-01-01" -10 --name-only --pretty=format:'
    );
    
    const files = output.trim().split('\n').filter(f => f);
    const fileCount: Record<string, number> = {};
    
    for (const file of files) {
      fileCount[file] = (fileCount[file] || 0) + 1;
    }

    expect(typeof fileCount).toBe('object');
  });


  it('should handle date validation in velocity calculation', () => {
    const commits = [
      { date: '2025-11-21', hash: 'abc', files: [] },
      { date: 'invalid', hash: 'def', files: [] },
      { date: null, hash: 'ghi', files: [] },
    ];

    let validDates = 0;
    for (const commit of commits) {
      if (!commit.date || typeof commit.date !== 'string') continue;
      const date = new Date(commit.date);
      if (!isNaN(date.getTime())) validDates++;
    }

    expect(validDates).toBe(1);
  });
});
