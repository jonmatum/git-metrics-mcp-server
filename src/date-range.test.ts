import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as handlers from './handlers.js';

describe('Date Range Handling QA', () => {
  let testRepo: string;

  beforeAll(() => {
    testRepo = join(tmpdir(), `date-range-test-${Date.now()}`);
    mkdirSync(testRepo, { recursive: true });
    
    execSync('git init', { cwd: testRepo });
    execSync('git config user.email "test@example.com"', { cwd: testRepo });
    execSync('git config user.name "Test User"', { cwd: testRepo });
    
    // Create commits on specific dates
    const dates = [
      '2025-01-15',
      '2025-02-10',
      '2025-03-05',
      '2025-04-20',
      '2025-05-25',
    ];

    dates.forEach((date, i) => {
      writeFileSync(join(testRepo, `file${i}.txt`), `content ${i}\n`);
      execSync('git add .', { cwd: testRepo });
      execSync(`GIT_COMMITTER_DATE="${date} 12:00:00" git commit --date="${date} 12:00:00" -m "Commit ${i}"`, { 
        cwd: testRepo,
        env: { ...process.env, GIT_COMMITTER_DATE: `${date} 12:00:00` }
      });
    });
  });

  afterAll(() => {
    if (testRepo) {
      rmSync(testRepo, { recursive: true, force: true });
    }
  });

  describe('get_commit_stats', () => {
    it('should respect since parameter', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2025-03-01',
      });
      
      // Should get commits from March onwards (3 commits: Mar, Apr, May)
      expect(result.commits).toBe(3);
    });

    it('should respect since and until parameters', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });
      
      // Should get commits from Feb and Mar only (2 commits)
      expect(result.commits).toBe(2);
    });

    it('should handle exact date boundaries', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2025-02-10',
        until: '2025-02-10',
      });
      
      // Should include the commit on 2025-02-10
      expect(result.commits).toBeGreaterThanOrEqual(1);
    });

    it('should return zero commits when range has no commits', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2025-06-01',
        until: '2025-06-30',
      });
      
      expect(result.commits).toBe(0);
    });
  });

  describe('get_author_metrics', () => {
    it('should respect since parameter', () => {
      const result = handlers.handleGetAuthorMetrics({
        repo_path: testRepo,
        since: '2025-03-01',
      });
      
      const authors = Object.keys(result);
      expect(authors.length).toBeGreaterThan(0);
      const totalCommits = Object.values(result).reduce((sum: number, author: any) => sum + author.commits, 0);
      expect(totalCommits).toBe(3);
    });

    it('should respect since and until parameters', () => {
      const result = handlers.handleGetAuthorMetrics({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });
      
      const totalCommits = Object.values(result).reduce((sum: number, author: any) => sum + author.commits, 0);
      expect(totalCommits).toBe(2);
    });
  });

  describe('get_team_summary', () => {
    it('should respect since parameter', () => {
      const result = handlers.handleGetTeamSummary({
        repo_path: testRepo,
        since: '2025-03-01',
      });
      
      expect(result.period.since).toBe('2025-03-01');
      expect(result.period.until).toBe('now');
      expect(result.team.totalCommits).toBe(3);
    });

    it('should respect since and until parameters', () => {
      const result = handlers.handleGetTeamSummary({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });
      
      expect(result.period.since).toBe('2025-02-01');
      expect(result.period.until).toBe('2025-04-01');
      expect(result.team.totalCommits).toBe(2);
    });
  });

  describe('get_commit_patterns', () => {
    it('should respect since parameter', () => {
      const result = handlers.handleGetCommitPatterns({
        repo_path: testRepo,
        since: '2025-03-01',
      });
      
      expect(result).toHaveProperty('byDay');
      expect(result).toHaveProperty('byHour');
      
      // Count total commits from patterns
      const totalCommits = Object.values(result.byDay).reduce((sum: number, count: any) => sum + count, 0);
      expect(totalCommits).toBe(3);
    });

    it('should respect since and until parameters', () => {
      const result = handlers.handleGetCommitPatterns({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });
      
      const totalCommits = Object.values(result.byDay).reduce((sum: number, count: any) => sum + count, 0);
      expect(totalCommits).toBe(2);
    });
  });

  describe('get_file_churn', () => {
    it('should respect since parameter', () => {
      const result = handlers.handleGetFileChurn({
        repo_path: testRepo,
        since: '2025-03-01',
      });
      
      // Should have 3 files (from 3 commits)
      expect(result.length).toBe(3);
    });

    it('should not have until parameter but should work with since', () => {
      const result = handlers.handleGetFileChurn({
        repo_path: testRepo,
        since: '2025-01-01',
      });
      
      // Should have all 5 files
      expect(result.length).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle future dates gracefully', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2026-01-01',
      });
      
      expect(result.commits).toBe(0);
    });

    it('should handle very old dates', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2020-01-01',
      });
      
      expect(result.commits).toBe(5);
    });

    it('should handle until before since (should return 0)', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2025-05-01',
        until: '2025-01-01',
      });
      
      expect(result.commits).toBe(0);
    });
  });

  describe('Consistency Check', () => {
    it('should return consistent results across different tools', () => {
      const commitStats = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });

      const authorMetrics = handlers.handleGetAuthorMetrics({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });

      const teamSummary = handlers.handleGetTeamSummary({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });

      const commitPatterns = handlers.handleGetCommitPatterns({
        repo_path: testRepo,
        since: '2025-02-01',
        until: '2025-04-01',
      });

      // All should report 2 commits
      expect(commitStats.commits).toBe(2);
      
      const authorCommits = Object.values(authorMetrics).reduce((sum: number, author: any) => sum + author.commits, 0);
      expect(authorCommits).toBe(2);
      
      expect(teamSummary.team.totalCommits).toBe(2);
      
      const patternCommits = Object.values(commitPatterns.byDay).reduce((sum: number, count: any) => sum + count, 0);
      expect(patternCommits).toBe(2);
    });
  });
});
