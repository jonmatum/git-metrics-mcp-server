import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleGetTechnicalDebt } from './handlers.js';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';

const TEST_REPO = resolve(process.cwd(), 'test-repo-debt');

beforeAll(() => {
  rmSync(TEST_REPO, { recursive: true, force: true });
  mkdirSync(TEST_REPO, { recursive: true });
  execSync('git init', { cwd: TEST_REPO });
  execSync('git config user.email "test@example.com"', { cwd: TEST_REPO });
  execSync('git config user.name "Test User"', { cwd: TEST_REPO });
  
  // Create multiple files
  for (let i = 1; i <= 5; i++) {
    writeFileSync(resolve(TEST_REPO, `file${i}.txt`), `content ${i}`);
  }
  execSync('git add .', { cwd: TEST_REPO });
  execSync('git commit -m "initial"', { cwd: TEST_REPO });
  
  // Modify one file multiple times
  for (let i = 0; i < 3; i++) {
    writeFileSync(resolve(TEST_REPO, 'file1.txt'), `update ${i}`);
    execSync('git add file1.txt', { cwd: TEST_REPO });
    execSync(`git commit -m "update ${i}"`, { cwd: TEST_REPO });
  }
});

afterAll(() => {
  rmSync(TEST_REPO, { recursive: true, force: true });
});

describe('Technical Debt Handler', () => {
  it('should identify stale files', () => {
    const result = handleGetTechnicalDebt({
      repo_path: TEST_REPO,
      stale_days: 0
    });
    expect(result.staleFiles).toBeDefined();
    expect(Array.isArray(result.staleFiles)).toBe(true);
  });

  it('should identify complexity hotspots', () => {
    const result = handleGetTechnicalDebt({
      repo_path: TEST_REPO
    });
    expect(result.complexityHotspots).toBeDefined();
    expect(Array.isArray(result.complexityHotspots)).toBe(true);
  });

  it('should use default stale_days', () => {
    const result = handleGetTechnicalDebt({
      repo_path: TEST_REPO
    });
    expect(result).toBeDefined();
  });
});
