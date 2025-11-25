import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as handlers from './handlers.js';

describe('Handler Functions', () => {
  let testRepo: string;
  const testDate = '2020-01-01';

  beforeAll(() => {
    testRepo = join(tmpdir(), `handler-test-${Date.now()}`);
    mkdirSync(testRepo, { recursive: true });
    
    execSync('git init', { cwd: testRepo });
    execSync('git config user.email "test@example.com"', { cwd: testRepo });
    execSync('git config user.name "Test User"', { cwd: testRepo });
    
    writeFileSync(join(testRepo, 'file1.txt'), 'content1\n');
    execSync('git add .', { cwd: testRepo });
    execSync('git commit -m "Initial commit"', { cwd: testRepo });
    
    writeFileSync(join(testRepo, 'file2.txt'), 'content2\n');
    execSync('git add .', { cwd: testRepo });
    execSync('git commit -m "Add file2"', { cwd: testRepo });
  });

  describe('handleGetCommitStats', () => {
    it('should return commit statistics', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('commits');
      expect(result).toHaveProperty('additions');
      expect(result).toHaveProperty('deletions');
      expect(result).toHaveProperty('filesChanged');
      expect(result).toHaveProperty('netChange');
      expect(result.commits).toBeGreaterThan(0);
    });

    it('should handle date range', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: testDate,
        until: '2030-01-01',
      });
      
      expect(result.commits).toBeGreaterThan(0);
    });

    it('should handle author filter', () => {
      const result = handlers.handleGetCommitStats({
        repo_path: testRepo,
        since: testDate,
        author: 'test@example.com',
      });
      
      expect(result.commits).toBeGreaterThan(0);
    });
  });

  describe('handleGetAuthorMetrics', () => {
    it('should return author metrics', () => {
      const result = handlers.handleGetAuthorMetrics({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(typeof result).toBe('object');
      const authors = Object.keys(result);
      expect(authors.length).toBeGreaterThan(0);
      
      const firstAuthor = result[authors[0]];
      expect(firstAuthor).toHaveProperty('commits');
      expect(firstAuthor).toHaveProperty('additions');
      expect(firstAuthor).toHaveProperty('deletions');
      expect(firstAuthor).toHaveProperty('files');
    });
  });

  describe('handleGetFileChurn', () => {
    it('should return file churn data', () => {
      const result = handlers.handleGetFileChurn({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('file');
      expect(result[0]).toHaveProperty('changes');
    });

    it('should respect limit parameter', () => {
      const result = handlers.handleGetFileChurn({
        repo_path: testRepo,
        since: testDate,
        limit: 1,
      });
      
      expect(result.length).toBeLessThanOrEqual(1);
    });
  });

  describe('handleGetTeamSummary', () => {
    it('should return team summary', () => {
      const result = handlers.handleGetTeamSummary({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('team');
      expect(result).toHaveProperty('contributors');
      expect(result.team).toHaveProperty('totalCommits');
      expect(result.team).toHaveProperty('contributors');
      expect(result.team.totalCommits).toBeGreaterThan(0);
    });
  });

  describe('handleGetCommitPatterns', () => {
    it('should return commit patterns', () => {
      const result = handlers.handleGetCommitPatterns({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('byDay');
      expect(result).toHaveProperty('byHour');
      expect(result).toHaveProperty('patterns');
      expect(result.patterns).toHaveProperty('weekendPercentage');
      expect(result.patterns).toHaveProperty('lateNightPercentage');
    });
  });

  describe('handleGetCodeOwnership', () => {
    it('should return code ownership data', () => {
      const result = handlers.handleGetCodeOwnership({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('totalFiles');
      expect(result).toHaveProperty('sharedFiles');
      expect(result).toHaveProperty('soloFiles');
      expect(result).toHaveProperty('busFactor');
      expect(result.totalFiles).toBeGreaterThan(0);
    });
  });

  describe('handleGetVelocityTrends', () => {
    it('should return velocity trends by week', () => {
      const result = handlers.handleGetVelocityTrends({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('interval');
      expect(result).toHaveProperty('trends');
      expect(result.interval).toBe('week');
      expect(Array.isArray(result.trends)).toBe(true);
    });

    it('should support month interval', () => {
      const result = handlers.handleGetVelocityTrends({
        repo_path: testRepo,
        since: testDate,
        interval: 'month',
      });
      
      expect(result.interval).toBe('month');
    });
  });

  describe('handleGetCollaborationMetrics', () => {
    it('should return collaboration metrics', () => {
      const result = handlers.handleGetCollaborationMetrics({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('collaborativeFiles');
      expect(result).toHaveProperty('topCollaborations');
      expect(Array.isArray(result.topCollaborations)).toBe(true);
    });
  });

  describe('handleGetQualityMetrics', () => {
    it('should return quality metrics', () => {
      const result = handlers.handleGetQualityMetrics({
        repo_path: testRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('averageCommitSize');
      expect(result).toHaveProperty('medianCommitSize');
      expect(result).toHaveProperty('revertRate');
      expect(result).toHaveProperty('fixRate');
    });
  });

  describe('handleGetTechnicalDebt', () => {
    it('should return technical debt data', () => {
      const result = handlers.handleGetTechnicalDebt({
        repo_path: testRepo,
      });
      
      expect(result).toHaveProperty('staleFiles');
      expect(result).toHaveProperty('complexityHotspots');
      expect(Array.isArray(result.staleFiles)).toBe(true);
      expect(Array.isArray(result.complexityHotspots)).toBe(true);
    });

    it('should respect stale_days parameter', () => {
      const result = handlers.handleGetTechnicalDebt({
        repo_path: testRepo,
        stale_days: 1,
      });
      
      expect(result).toHaveProperty('staleFiles');
    });
  });

  describe('handleGetConventionalCommits', () => {
    let conventionalRepo: string;

    beforeAll(() => {
      conventionalRepo = join(tmpdir(), `conventional-test-${Date.now()}`);
      mkdirSync(conventionalRepo, { recursive: true });
      
      execSync('git init', { cwd: conventionalRepo });
      execSync('git config user.email "test@example.com"', { cwd: conventionalRepo });
      execSync('git config user.name "Test User"', { cwd: conventionalRepo });
      
      writeFileSync(join(conventionalRepo, 'file1.txt'), 'content1\n');
      execSync('git add .', { cwd: conventionalRepo });
      execSync('git commit -m "feat(core): add new feature"', { cwd: conventionalRepo });
      
      writeFileSync(join(conventionalRepo, 'file2.txt'), 'content2\n');
      execSync('git add .', { cwd: conventionalRepo });
      execSync('git commit -m "fix: resolve bug"', { cwd: conventionalRepo });
      
      writeFileSync(join(conventionalRepo, 'file3.txt'), 'content3\n');
      execSync('git add .', { cwd: conventionalRepo });
      execSync('git commit -m "feat!: breaking change"', { cwd: conventionalRepo });
      
      execSync('git tag v1.0.0', { cwd: conventionalRepo });
    });

    it('should analyze conventional commits', () => {
      const result = handlers.handleGetConventionalCommits({
        repo_path: conventionalRepo,
        since: testDate,
      });
      
      expect(result).toHaveProperty('totalCommits');
      expect(result).toHaveProperty('conventionalCommits');
      expect(result).toHaveProperty('conventionalPercentage');
      expect(result).toHaveProperty('commitTypes');
      expect(result).toHaveProperty('topScopes');
      expect(result).toHaveProperty('breakingChanges');
      expect(result).toHaveProperty('recentReleases');
      expect(result).toHaveProperty('releaseFrequency');
      
      expect(result.totalCommits).toBe(3);
      expect(result.conventionalCommits).toBe(3);
      expect(result.conventionalPercentage).toBe('100.0%');
      expect(result.breakingChanges).toBe(1);
    });

    it('should identify commit types', () => {
      const result = handlers.handleGetConventionalCommits({
        repo_path: conventionalRepo,
        since: testDate,
      });
      
      expect(Array.isArray(result.commitTypes)).toBe(true);
      const types = result.commitTypes.map((t: any) => t.type);
      expect(types).toContain('feat');
      expect(types).toContain('fix');
    });

    it('should identify scopes', () => {
      const result = handlers.handleGetConventionalCommits({
        repo_path: conventionalRepo,
        since: testDate,
      });
      
      expect(Array.isArray(result.topScopes)).toBe(true);
      if (result.topScopes.length > 0) {
        expect(result.topScopes[0]).toHaveProperty('scope');
        expect(result.topScopes[0]).toHaveProperty('count');
      }
    });

    it('should list releases', () => {
      const result = handlers.handleGetConventionalCommits({
        repo_path: conventionalRepo,
        since: testDate,
      });
      
      expect(Array.isArray(result.recentReleases)).toBe(true);
      expect(result.recentReleases.length).toBeGreaterThan(0);
      expect(result.recentReleases[0]).toHaveProperty('tag');
      expect(result.recentReleases[0]).toHaveProperty('date');
    });
  });
});
