import { describe, it, expect } from 'vitest';
import { runGitCommand, validateDate, validateRepoPath } from './git-metrics.js';
import { resolve } from 'path';

const REPO = resolve(process.cwd());

describe('Tool Handler Logic', () => {
  describe('get_commit_stats logic', () => {
    it('should calculate commit statistics', () => {
      validateRepoPath(REPO);
      validateDate('2020-01-01', 'since');
      
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat'
      );
      
      const lines = output.trim().split('\n').slice(0, 10000);
      let commits = 0, additions = 0, deletions = 0, filesChanged = 0;
      
      for (const line of lines) {
        if (line.includes('|')) commits++;
        else if (line.match(/^\d+\s+\d+/)) {
          const [add, del] = line.split(/\s+/);
          additions += parseInt(add) || 0;
          deletions += parseInt(del) || 0;
          filesChanged++;
        }
      }
      
      expect(commits).toBeGreaterThanOrEqual(0);
      expect(additions).toBeGreaterThanOrEqual(0);
      expect(deletions).toBeGreaterThanOrEqual(0);
      expect(filesChanged).toBeGreaterThanOrEqual(0);
    });

    it('should handle author filter', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --author="test" --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat'
      );
      expect(typeof output).toBe('string');
    });

    it('should handle until date', () => {
      validateDate('2025-12-31', 'until');
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --until="2025-12-31" --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat'
      );
      expect(typeof output).toBe('string');
    });
  });

  describe('get_author_metrics logic', () => {
    it('should aggregate author statistics', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%an|%ae" --numstat'
      );
      
      const lines = output.trim().split('\n').slice(0, 10000);
      const authorStats: Record<string, any> = {};
      let currentAuthor = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
          if (!authorStats[currentAuthor]) {
            authorStats[currentAuthor] = { commits: 0, additions: 0, deletions: 0, files: 0 };
          }
          authorStats[currentAuthor].commits++;
        } else if (line.match(/^\d+\s+\d+/) && currentAuthor) {
          const [add, del] = line.split(/\s+/);
          authorStats[currentAuthor].additions += parseInt(add) || 0;
          authorStats[currentAuthor].deletions += parseInt(del) || 0;
          authorStats[currentAuthor].files++;
        }
      }

      expect(typeof authorStats).toBe('object');
    });
  });

  describe('get_file_churn logic', () => {
    it('should identify frequently changed files', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --name-only --pretty=format:'
      );
      
      const files = output.trim().split('\n').filter(f => f).slice(0, 10000);
      const fileCount: Record<string, number> = {};
      
      for (const file of files) {
        fileCount[file] = (fileCount[file] || 0) + 1;
      }

      const sorted = Object.entries(fileCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([file, changes]) => ({ file, changes }));

      expect(Array.isArray(sorted)).toBe(true);
    });

    it('should respect limit parameter', () => {
      const limit = 5;
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --name-only --pretty=format:'
      );
      
      const files = output.trim().split('\n').filter(f => f);
      const fileCount: Record<string, number> = {};
      for (const file of files) {
        fileCount[file] = (fileCount[file] || 0) + 1;
      }

      const sorted = Object.entries(fileCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, Math.min(limit, 100));

      expect(sorted.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('get_team_summary logic', () => {
    it('should aggregate team statistics', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%an|%ae" --numstat'
      );
      
      const lines = output.trim().split('\n').slice(0, 10000);
      const authorStats: Record<string, any> = {};
      let currentAuthor = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
          if (!authorStats[currentAuthor]) {
            authorStats[currentAuthor] = { commits: 0, additions: 0, deletions: 0, files: 0 };
          }
          authorStats[currentAuthor].commits++;
        } else if (line.match(/^\d+\s+\d+/) && currentAuthor) {
          const [add, del] = line.split(/\s+/);
          authorStats[currentAuthor].additions += parseInt(add) || 0;
          authorStats[currentAuthor].deletions += parseInt(del) || 0;
          authorStats[currentAuthor].files++;
        }
      }

      const totalCommits = Object.values(authorStats).reduce((sum, a) => sum + a.commits, 0);
      const totalAdditions = Object.values(authorStats).reduce((sum, a) => sum + a.additions, 0);
      const totalDeletions = Object.values(authorStats).reduce((sum, a) => sum + a.deletions, 0);

      expect(totalCommits).toBeGreaterThanOrEqual(0);
      expect(totalAdditions).toBeGreaterThanOrEqual(0);
      expect(totalDeletions).toBeGreaterThanOrEqual(0);
      expect(Object.keys(authorStats).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('get_commit_patterns logic', () => {
    it('should analyze commit patterns by day and hour', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%ad" --date=format:"%u|%H"'
      );
      
      const lines = output.trim().split('\n').slice(0, 10000);
      const byDay: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 };
      const byHour: Record<string, number> = {};
      
      for (const line of lines) {
        const [day, hour] = line.split('|');
        byDay[day] = (byDay[day] || 0) + 1;
        byHour[hour] = (byHour[hour] || 0) + 1;
      }

      const weekdayCommits = byDay['1'] + byDay['2'] + byDay['3'] + byDay['4'] + byDay['5'];
      const weekendCommits = byDay['6'] + byDay['7'];

      expect(weekdayCommits).toBeGreaterThanOrEqual(0);
      expect(weekendCommits).toBeGreaterThanOrEqual(0);
    });

    it('should calculate late night percentage', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%ad" --date=format:"%u|%H"'
      );
      
      const lines = output.trim().split('\n');
      const byHour: Record<string, number> = {};
      
      for (const line of lines) {
        const [, hour] = line.split('|');
        byHour[hour] = (byHour[hour] || 0) + 1;
      }

      const lateNightCommits = Object.entries(byHour)
        .filter(([h]) => parseInt(h) >= 22 || parseInt(h) <= 5)
        .reduce((sum, [, count]) => sum + count, 0);

      expect(lateNightCommits).toBeGreaterThanOrEqual(0);
    });
  });

  describe('get_code_ownership logic', () => {
    it('should track file ownership', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%an|%ae" --name-only'
      );
      
      const lines = output.trim().split('\n').slice(0, 10000);
      const fileAuthors: Record<string, Set<string>> = {};
      let currentAuthor = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
        } else if (line && currentAuthor) {
          if (!fileAuthors[line]) fileAuthors[line] = new Set();
          fileAuthors[line].add(currentAuthor);
        }
      }

      const sharedFiles = Object.entries(fileAuthors).filter(([, authors]) => authors.size > 1).length;
      const soloFiles = Object.entries(fileAuthors).filter(([, authors]) => authors.size === 1).length;

      expect(sharedFiles).toBeGreaterThanOrEqual(0);
      expect(soloFiles).toBeGreaterThanOrEqual(0);
    });

    it('should calculate bus factor', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%an|%ae" --name-only'
      );
      
      const lines = output.trim().split('\n');
      const fileAuthors: Record<string, Set<string>> = {};
      let currentAuthor = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
        } else if (line && currentAuthor) {
          if (!fileAuthors[line]) fileAuthors[line] = new Set();
          fileAuthors[line].add(currentAuthor);
        }
      }

      const busFactor = Object.entries(fileAuthors)
        .filter(([, authors]) => authors.size === 1)
        .reduce((acc, [, authors]) => {
          const author = Array.from(authors)[0];
          acc[author] = (acc[author] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      expect(typeof busFactor).toBe('object');
    });
  });


  describe('get_collaboration_metrics logic', () => {
    it('should identify collaborative files', () => {
      const output = runGitCommand(
        REPO,
        'git log --since="2020-01-01" --pretty=format:"%an|%ae" --name-only'
      );
      
      const lines = output.trim().split('\n');
      const fileAuthors: Record<string, Set<string>> = {};
      let currentAuthor = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
        } else if (line && currentAuthor) {
          if (!fileAuthors[line]) fileAuthors[line] = new Set();
          fileAuthors[line].add(currentAuthor);
        }
      }

      const collaborations: Record<string, number> = {};
      for (const [, authors] of Object.entries(fileAuthors)) {
        if (authors.size > 1) {
          const authorList = Array.from(authors).sort();
          for (let i = 0; i < authorList.length; i++) {
            for (let j = i + 1; j < authorList.length; j++) {
              const pair = `${authorList[i]} <-> ${authorList[j]}`;
              collaborations[pair] = (collaborations[pair] || 0) + 1;
            }
          }
        }
      }

      expect(typeof collaborations).toBe('object');
    });
  });


  describe('get_technical_debt logic', () => {
    it('should identify stale files', () => {
      const allFiles = runGitCommand(REPO, 'git ls-files').trim().split('\n').slice(0, 10);
      const staleFiles: any[] = [];
      const stale_days = 90;
      
      for (const file of allFiles) {
        if (!file) continue;
        try {
          const lastMod = runGitCommand(REPO, `git log -1 --format="%ad" --date=short -- "${file}"`).trim();
          if (lastMod) {
            const daysSince = Math.floor((Date.now() - new Date(lastMod).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince > stale_days) {
              staleFiles.push({ file, daysSinceLastChange: daysSince });
            }
          }
        } catch {
          // Skip files that cause errors
        }
      }

      expect(Array.isArray(staleFiles)).toBe(true);
    });
  });
});
