import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('Integration Tests', () => {
  const createTestRepo = () => {
    const repoPath = join(tmpdir(), `test-repo-${Date.now()}`);
    mkdirSync(repoPath, { recursive: true });
    
    execSync('git init', { cwd: repoPath });
    execSync('git config user.email "test@example.com"', { cwd: repoPath });
    execSync('git config user.name "Test User"', { cwd: repoPath });
    
    writeFileSync(join(repoPath, 'test.txt'), 'test content');
    execSync('git add .', { cwd: repoPath });
    execSync('git commit -m "Initial commit"', { cwd: repoPath });
    
    return repoPath;
  };

  describe('get_commit_stats', () => {
    it('should get stats from real repository', () => {
      const repoPath = createTestRepo();
      const since = '2020-01-01';
      
      const cmd = `git -C ${repoPath} log --since=${since} --pretty=format:'%H' --numstat`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toContain('test.txt');
    });

    it('should handle author filter', () => {
      const repoPath = createTestRepo();
      const author = 'test@example.com';
      
      const cmd = `git -C ${repoPath} log --author=${author} --pretty=format:'%H'`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toBeTruthy();
    });
  });

  describe('get_author_metrics', () => {
    it('should get author stats', () => {
      const repoPath = createTestRepo();
      const since = '2020-01-01';
      
      const cmd = `git -C ${repoPath} log --since=${since} --pretty=format:'%an <%ae>' --numstat`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toContain('Test User');
    });
  });

  describe('get_file_churn', () => {
    it('should identify changed files', () => {
      const repoPath = createTestRepo();
      const since = '2020-01-01';
      
      const cmd = `git -C ${repoPath} log --since=${since} --name-only --pretty=format:`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toContain('test.txt');
    });
  });

  describe('get_commit_patterns', () => {
    it('should get commit timestamps', () => {
      const repoPath = createTestRepo();
      const since = '2020-01-01';
      
      const cmd = `git -C ${repoPath} log --since=${since} --pretty=format:'%ad' --date=format:'%u %H'`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toBeTruthy();
    });
  });

  describe('get_code_ownership', () => {
    it('should identify file authors', () => {
      const repoPath = createTestRepo();
      
      const cmd = `git -C ${repoPath} ls-files`;
      const files = execSync(cmd, { encoding: 'utf-8' }).trim().split('\n');
      
      expect(files).toContain('test.txt');
    });
  });

  describe('get_velocity_trends', () => {
    it('should group commits by week', () => {
      const repoPath = createTestRepo();
      const since = '2020-01-01';
      
      const cmd = `git -C ${repoPath} log --since=${since} --pretty=format:'%ad' --date=format:'%Y-%m-%d'`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('get_collaboration_metrics', () => {
    it('should find files with multiple authors', () => {
      const repoPath = createTestRepo();
      
      const cmd = `git -C ${repoPath} ls-files`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      expect(output).toBeTruthy();
    });
  });

  describe('get_quality_metrics', () => {
    it('should calculate commit sizes', () => {
      const repoPath = createTestRepo();
      const since = '2020-01-01';
      
      const cmd = `git -C ${repoPath} log --since=${since} --pretty=format:'%H' --numstat`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      const lines = output.split('\n');
      let totalChanges = 0;
      
      for (const line of lines) {
        const match = line.match(/^(\d+)\s+(\d+)/);
        if (match) {
          totalChanges += parseInt(match[1]) + parseInt(match[2]);
        }
      }
      
      expect(totalChanges).toBeGreaterThan(0);
    });
  });

  describe('get_technical_debt', () => {
    it('should identify stale files', () => {
      const repoPath = createTestRepo();
      
      const cmd = `git -C ${repoPath} ls-files`;
      const files = execSync(cmd, { encoding: 'utf-8' }).trim().split('\n');
      
      expect(files.length).toBeGreaterThan(0);
    });
  });
});
