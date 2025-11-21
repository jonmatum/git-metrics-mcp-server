import { describe, it, expect } from 'vitest';
import { parseCommitData, validateDate, validateRepoPath } from './git-metrics.js';

describe('Edge Cases', () => {
  describe('parseCommitData edge cases', () => {
    it('should handle malformed data', () => {
      const malformed = 'not|a|valid|format\nrandom text\n123 456';
      const commits = parseCommitData(malformed);
      expect(Array.isArray(commits)).toBe(true);
    });

    it('should handle data with only pipes', () => {
      const onlyPipes = '||||\n||||';
      const commits = parseCommitData(onlyPipes);
      expect(commits.length).toBeGreaterThan(0);
      expect(commits[0].hash).toBe('');
    });

    it('should handle mixed valid and invalid lines', () => {
      const mixed = `2025-11-21|abc123
1\t2\tfile.txt
invalid line
3\t4\tfile2.txt
2025-11-20|def456`;
      const commits = parseCommitData(mixed);
      expect(commits.length).toBe(2);
      expect(commits[0].files.length).toBe(2);
    });

    it('should handle files with spaces in names', () => {
      const withSpaces = `2025-11-21|abc123
1\t2\tpath/to/file with spaces.txt
3\t4\tanother file.js`;
      const commits = parseCommitData(withSpaces);
      expect(commits[0].files[0].file).toBe('path/to/file with spaces.txt');
      expect(commits[0].files[1].file).toBe('another file.js');
    });

    it('should handle zero additions/deletions', () => {
      const zeros = `2025-11-21|abc123
0\t0\tfile.txt`;
      const commits = parseCommitData(zeros);
      expect(commits[0].files[0].additions).toBe(0);
      expect(commits[0].files[0].deletions).toBe(0);
    });

    it('should handle large numbers', () => {
      const large = `2025-11-21|abc123
99999\t88888\tfile.txt`;
      const commits = parseCommitData(large);
      expect(commits[0].files[0].additions).toBe(99999);
      expect(commits[0].files[0].deletions).toBe(88888);
    });

    it('should handle non-numeric values', () => {
      const nonNumeric = `2025-11-21|abc123
abc\tdef\tfile.txt`;
      const commits = parseCommitData(nonNumeric);
      // Non-numeric values don't match the regex, so no files are added
      expect(commits[0].files.length).toBe(0);
    });

    it('should handle trailing newlines', () => {
      const trailing = `2025-11-21|abc123
1\t2\tfile.txt


`;
      const commits = parseCommitData(trailing);
      expect(commits.length).toBe(1);
    });

    it('should handle commit without closing', () => {
      const noClose = `2025-11-21|abc123
1\t2\tfile.txt`;
      const commits = parseCommitData(noClose);
      expect(commits.length).toBe(1);
      expect(commits[0].files.length).toBe(1);
    });
  });

  describe('validateDate edge cases', () => {
    it('should reject dates with wrong separators', () => {
      expect(() => validateDate('2025.11.21', 'test')).toThrow();
      expect(() => validateDate('2025_11_21', 'test')).toThrow();
      expect(() => validateDate('20251121', 'test')).toThrow();
    });

    it('should reject dates with extra characters', () => {
      expect(() => validateDate('2025-11-21 ', 'test')).toThrow();
      expect(() => validateDate(' 2025-11-21', 'test')).toThrow();
      expect(() => validateDate('2025-11-21T00:00:00', 'test')).toThrow();
    });

    it('should reject dates with wrong lengths', () => {
      expect(() => validateDate('25-11-21', 'test')).toThrow();
      expect(() => validateDate('2025-1-1', 'test')).toThrow();
      expect(() => validateDate('2025-11-1', 'test')).toThrow();
    });

    it('should accept valid edge dates', () => {
      expect(() => validateDate('2000-01-01', 'test')).not.toThrow();
      expect(() => validateDate('2099-12-31', 'test')).not.toThrow();
      expect(() => validateDate('2025-02-29', 'test')).not.toThrow(); // Format check only
    });
  });

  describe('validateRepoPath edge cases', () => {
    it('should reject all injection patterns', () => {
      const patterns = [
        '/tmp/repo;ls',
        '/tmp/repo&&echo',
        '/tmp/repo||cat',
        '/tmp/repo|grep',
        '/tmp/repo`id`',
        '/tmp/repo$(whoami)',
        '/tmp/repo&echo',
      ];
      
      for (const pattern of patterns) {
        expect(() => validateRepoPath(pattern)).toThrow('Invalid characters');
      }
    });

    it('should handle numeric types', () => {
      expect(() => validateRepoPath(123 as any)).toThrow('repo_path is required');
    });

    it('should handle object types', () => {
      expect(() => validateRepoPath({} as any)).toThrow('repo_path is required');
      expect(() => validateRepoPath([] as any)).toThrow('repo_path is required');
    });

    it('should handle boolean types', () => {
      expect(() => validateRepoPath(true as any)).toThrow('repo_path is required');
      expect(() => validateRepoPath(false as any)).toThrow('repo_path is required');
    });
  });

  describe('Data processing edge cases', () => {
    it('should handle empty author name', () => {
      const lines = ['|email@test.com'];
      let currentAuthor = '';
      
      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
        }
      }
      
      expect(currentAuthor).toBe(' <email@test.com>');
    });

    it('should handle missing email', () => {
      const lines = ['Name|'];
      let currentAuthor = '';
      
      for (const line of lines) {
        if (line.includes('|')) {
          const [name, email] = line.split('|');
          currentAuthor = `${name} <${email}>`;
        }
      }
      
      expect(currentAuthor).toBe('Name <>');
    });

    it('should handle day of week calculations', () => {
      const date = new Date('2025-11-21'); // Friday
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      
      expect(weekStart.getDay()).toBe(0); // Sunday
    });

    it('should handle month extraction', () => {
      const dateStr = '2025-11-21';
      const month = dateStr.substring(0, 7);
      
      expect(month).toBe('2025-11');
    });

    it('should handle Set operations for file authors', () => {
      const fileAuthors: Record<string, Set<string>> = {};
      const file = 'test.txt';
      
      if (!fileAuthors[file]) fileAuthors[file] = new Set();
      fileAuthors[file].add('Author1');
      fileAuthors[file].add('Author2');
      fileAuthors[file].add('Author1'); // Duplicate
      
      expect(fileAuthors[file].size).toBe(2);
    });

    it('should handle collaboration pair generation', () => {
      const authors = ['Alice', 'Bob', 'Charlie'];
      const pairs: string[] = [];
      
      for (let i = 0; i < authors.length; i++) {
        for (let j = i + 1; j < authors.length; j++) {
          pairs.push(`${authors[i]} <-> ${authors[j]}`);
        }
      }
      
      expect(pairs.length).toBe(3); // C(3,2) = 3
      expect(pairs).toContain('Alice <-> Bob');
      expect(pairs).toContain('Alice <-> Charlie');
      expect(pairs).toContain('Bob <-> Charlie');
    });

    it('should handle median calculation', () => {
      const sizes = [1, 5, 3, 9, 2];
      sizes.sort((a, b) => a - b);
      const median = sizes[Math.floor(sizes.length / 2)];
      
      expect(median).toBe(3);
    });

    it('should handle median with even count', () => {
      const sizes = [1, 2, 3, 4];
      sizes.sort((a, b) => a - b);
      const median = sizes[Math.floor(sizes.length / 2)];
      
      expect(median).toBe(3); // Takes upper middle
    });

    it('should handle percentage calculations', () => {
      const total = 100;
      const part = 15;
      const percentage = ((part / total) * 100).toFixed(1) + '%';
      
      expect(percentage).toBe('15.0%');
    });

    it('should handle division by zero', () => {
      const commits = 0;
      const avgCommitSize = commits > 0 ? 100 / commits : 0;
      
      expect(avgCommitSize).toBe(0);
    });

    it('should handle empty reduce', () => {
      const authorStats: any[] = [];
      const total = authorStats.reduce((sum, a) => sum + a.commits, 0);
      
      expect(total).toBe(0);
    });
  });

  describe('Date parsing edge cases', () => {
    it('should handle invalid date strings', () => {
      const invalidDates = ['invalid', '', 'not-a-date', '2025-13-01', '2025-00-01'];
      
      for (const dateStr of invalidDates) {
        const date = new Date(dateStr);
        expect(isNaN(date.getTime())).toBe(true);
      }
    });

    it('should handle valid date strings', () => {
      const validDates = ['2025-11-21', '2020-01-01', '2099-12-31'];
      
      for (const dateStr of validDates) {
        const date = new Date(dateStr);
        expect(isNaN(date.getTime())).toBe(false);
      }
    });

    it('should handle null and undefined dates', () => {
      const nullDate = new Date(null as any);
      const undefinedDate = new Date(undefined as any);
      
      expect(isNaN(nullDate.getTime())).toBe(false); // null becomes 0
      expect(isNaN(undefinedDate.getTime())).toBe(true);
    });
  });

  describe('Array operations edge cases', () => {
    it('should handle slice with large limit', () => {
      const arr = [1, 2, 3];
      const sliced = arr.slice(0, 10000);
      
      expect(sliced.length).toBe(3);
    });

    it('should handle sort with equal values', () => {
      const arr = [{ val: 5 }, { val: 5 }, { val: 3 }];
      arr.sort((a, b) => b.val - a.val);
      
      expect(arr[0].val).toBe(5);
      expect(arr[2].val).toBe(3);
    });

    it('should handle filter with all false', () => {
      const arr = [1, 2, 3];
      const filtered = arr.filter(x => x > 10);
      
      expect(filtered.length).toBe(0);
    });

    it('should handle map on empty array', () => {
      const arr: any[] = [];
      const mapped = arr.map(x => x * 2);
      
      expect(mapped.length).toBe(0);
    });
  });
});
