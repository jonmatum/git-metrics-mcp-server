import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runGitCommand, sanitizeInput, validateDate, validateRepoPath } from './git-metrics.js';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';

const TEST_REPO = resolve(process.cwd(), 'test-repo-core');

beforeAll(() => {
  rmSync(TEST_REPO, { recursive: true, force: true });
  mkdirSync(TEST_REPO, { recursive: true });
  execSync('git init', { cwd: TEST_REPO });
  execSync('git config user.email "test@example.com"', { cwd: TEST_REPO });
  execSync('git config user.name "Test User"', { cwd: TEST_REPO });
  writeFileSync(resolve(TEST_REPO, 'test.txt'), 'test');
  execSync('git add .', { cwd: TEST_REPO });
  execSync('git commit -m "test"', { cwd: TEST_REPO });
});

afterAll(() => {
  rmSync(TEST_REPO, { recursive: true, force: true });
});

describe('Core Functions', () => {
  describe('runGitCommand', () => {
    it('should execute git commands', () => {
      const result = runGitCommand(TEST_REPO, 'git log --oneline');
      expect(result).toContain('test');
    });

    it('should throw on non-existent repo', () => {
      expect(() => runGitCommand('/nonexistent', 'git log')).toThrow('does not exist');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('test;rm -rf')).toBe('testrm -rf');
      expect(sanitizeInput('test&whoami')).toBe('testwhoami');
      expect(sanitizeInput('test|cat')).toBe('testcat');
      expect(sanitizeInput('test`ls`')).toBe('testls');
      expect(sanitizeInput('test$HOME')).toBe('testHOME');
      expect(sanitizeInput('test()')).toBe('test');
    });

    it('should keep safe characters', () => {
      expect(sanitizeInput('test-file_123.txt')).toBe('test-file_123.txt');
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(() => validateDate('2025-11-26', 'test')).not.toThrow();
      expect(() => validateDate('2020-01-01', 'test')).not.toThrow();
    });

    it('should reject invalid formats', () => {
      expect(() => validateDate('2025/11/26', 'test')).toThrow('Invalid test format');
      expect(() => validateDate('11-26-2025', 'test')).toThrow('Invalid test format');
      expect(() => validateDate('invalid', 'test')).toThrow('Invalid test format');
    });
  });

  describe('validateRepoPath', () => {
    it('should accept valid repo paths', () => {
      expect(() => validateRepoPath(TEST_REPO)).not.toThrow();
    });

    it('should reject empty paths', () => {
      expect(() => validateRepoPath('')).toThrow('repo_path is required');
    });

    it('should reject non-string paths', () => {
      expect(() => validateRepoPath(null as any)).toThrow('repo_path is required');
    });

    it('should reject paths with dangerous characters', () => {
      expect(() => validateRepoPath('test;rm')).toThrow('Invalid characters');
    });

    it('should reject non-existent paths', () => {
      expect(() => validateRepoPath('/nonexistent')).toThrow('does not exist');
    });

    it('should reject non-git directories', () => {
      const nonGitDir = resolve(process.cwd(), 'test-non-git');
      mkdirSync(nonGitDir, { recursive: true });
      expect(() => validateRepoPath(nonGitDir)).toThrow('Not a git repository');
      rmSync(nonGitDir, { recursive: true, force: true });
    });
  });
});
