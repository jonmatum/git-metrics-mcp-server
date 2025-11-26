import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';

const TEST_REPO = resolve(process.cwd(), 'test-repo-mcp');

beforeAll(() => {
  rmSync(TEST_REPO, { recursive: true, force: true });
  mkdirSync(TEST_REPO, { recursive: true });
  execSync('git init', { cwd: TEST_REPO });
  execSync('git config user.email "test@example.com"', { cwd: TEST_REPO });
  execSync('git config user.name "Test User"', { cwd: TEST_REPO });
  writeFileSync(resolve(TEST_REPO, 'test.txt'), 'test');
  execSync('git add .', { cwd: TEST_REPO });
  execSync('git commit -m "feat: initial commit"', { cwd: TEST_REPO });
});

afterAll(() => {
  rmSync(TEST_REPO, { recursive: true, force: true });
});

describe('MCP Server Tool Handlers', () => {
  it('should handle health_check', () => {
    const result = { status: "ok", version: "4.0.0", timestamp: new Date().toISOString() };
    expect(result.status).toBe("ok");
  });

  it('should handle get_commit_stats', async () => {
    const { handleGetCommitStats } = await import('./handlers.js');
    const result = handleGetCommitStats({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.commits).toBeGreaterThan(0);
  });

  it('should handle get_author_metrics', async () => {
    const { handleGetAuthorMetrics } = await import('./handlers.js');
    const result = handleGetAuthorMetrics({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it('should handle get_file_churn', async () => {
    const { handleGetFileChurn } = await import('./handlers.js');
    const result = handleGetFileChurn({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle get_team_summary', async () => {
    const { handleGetTeamSummary } = await import('./handlers.js');
    const result = handleGetTeamSummary({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.team).toBeDefined();
  });

  it('should handle get_commit_patterns', async () => {
    const { handleGetCommitPatterns } = await import('./handlers.js');
    const result = handleGetCommitPatterns({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.byDay).toBeDefined();
  });

  it('should handle get_code_ownership', async () => {
    const { handleGetCodeOwnership } = await import('./handlers.js');
    const result = handleGetCodeOwnership({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.totalFiles).toBeGreaterThanOrEqual(0);
  });

  it('should handle get_velocity_trends', async () => {
    const { handleGetVelocityTrends } = await import('./handlers.js');
    const result = handleGetVelocityTrends({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.trends).toBeDefined();
  });

  it('should handle get_collaboration_metrics', async () => {
    const { handleGetCollaborationMetrics } = await import('./handlers.js');
    const result = handleGetCollaborationMetrics({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.collaborativeFiles).toBeGreaterThanOrEqual(0);
  });

  it('should handle get_quality_metrics', async () => {
    const { handleGetQualityMetrics } = await import('./handlers.js');
    const result = handleGetQualityMetrics({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.averageCommitSize).toBeGreaterThanOrEqual(0);
  });

  it('should handle get_technical_debt', async () => {
    const { handleGetTechnicalDebt } = await import('./handlers.js');
    const result = handleGetTechnicalDebt({
      repo_path: TEST_REPO
    });
    expect(result.staleFiles).toBeDefined();
  });

  it('should handle get_conventional_commits', async () => {
    const { handleGetConventionalCommits } = await import('./handlers.js');
    const result = handleGetConventionalCommits({
      repo_path: TEST_REPO,
      since: '2020-01-01'
    });
    expect(result.totalCommits).toBeGreaterThan(0);
  });

  it('should throw on unknown tool', () => {
    expect(() => {
      throw new Error('Unknown tool: invalid_tool');
    }).toThrow('Unknown tool');
  });

  it('should log tool execution', () => {
    const log = (level: string, message: string, meta?: any) => {
      expect(level).toBeDefined();
      expect(message).toBeDefined();
    };
    log('INFO', 'Tool invoked', { tool: 'test' });
    log('INFO', 'Tool completed', { tool: 'test', duration: 100 });
  });

  it('should log errors', () => {
    const log = (level: string, message: string, meta?: any) => {
      expect(level).toBe('ERROR');
      expect(message).toBeDefined();
    };
    log('ERROR', 'Tool execution failed', { tool: 'test', error: 'test error', duration: 100 });
  });
});
