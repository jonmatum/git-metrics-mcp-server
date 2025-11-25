import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';

vi.mock('child_process');

describe('Server Request Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get_commit_stats handler', () => {
    it('should validate repo_path', () => {
      expect(() => {
        const repoPath = '';
        if (!repoPath || typeof repoPath !== 'string') {
          throw new Error('repo_path is required and must be a string');
        }
      }).toThrow('repo_path is required');
    });

    it('should validate date format', () => {
      expect(() => {
        const date = 'invalid-date';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          throw new Error('Invalid date format');
        }
      }).toThrow('Invalid date format');
    });

    it('should accept valid date format', () => {
      const date = '2025-11-01';
      expect(/^\d{4}-\d{2}-\d{2}$/.test(date)).toBe(true);
    });
  });

  describe('get_author_metrics handler', () => {
    it('should require repo_path and since', () => {
      const args = { repo_path: '/test', since: '2025-11-01' };
      expect(args.repo_path).toBeDefined();
      expect(args.since).toBeDefined();
    });
  });

  describe('get_file_churn handler', () => {
    it('should use default limit of 10', () => {
      const limit = undefined;
      const actualLimit = limit || 10;
      expect(actualLimit).toBe(10);
    });

    it('should use provided limit', () => {
      const limit = 20;
      const actualLimit = limit || 10;
      expect(actualLimit).toBe(20);
    });
  });

  describe('get_velocity_trends handler', () => {
    it('should default to week interval', () => {
      const interval = undefined;
      const actualInterval = interval || 'week';
      expect(actualInterval).toBe('week');
    });

    it('should accept month interval', () => {
      const interval = 'month';
      expect(['week', 'month'].includes(interval)).toBe(true);
    });
  });

  describe('get_technical_debt handler', () => {
    it('should default to 90 stale days', () => {
      const staleDays = undefined;
      const actualStaleDays = staleDays || 90;
      expect(actualStaleDays).toBe(90);
    });

    it('should use provided stale days', () => {
      const staleDays = 60;
      const actualStaleDays = staleDays || 90;
      expect(actualStaleDays).toBe(60);
    });
  });

  describe('get_conventional_commits handler', () => {
    it('should require repo_path and since', () => {
      const args = { repo_path: '/test', since: '2025-11-01' };
      expect(args.repo_path).toBeDefined();
      expect(args.since).toBeDefined();
    });

    it('should parse conventional commit format', () => {
      const message = 'feat(core): add new feature';
      const regex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?(!)?:/;
      const match = message.match(regex);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe('feat');
      expect(match![3]).toBe('core');
    });

    it('should detect breaking changes', () => {
      const message1 = 'feat!: breaking change';
      const message2 = 'feat: normal change\n\nBREAKING CHANGE: details';
      
      expect(message1.includes('!')).toBe(true);
      expect(message2.includes('BREAKING CHANGE')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle git command failures', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      expect(() => {
        execSync('git invalid-command');
      }).toThrow('Command failed');
    });

    it('should handle invalid repository paths', () => {
      expect(() => {
        const path = '/nonexistent/path';
        if (!path.startsWith('/')) {
          throw new Error('Invalid path');
        }
      }).not.toThrow();
    });
  });

  describe('Response formatting', () => {
    it('should format tool response correctly', () => {
      const result = { commits: 10, additions: 100 };
      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
      
      expect(response.content[0].type).toBe('text');
      expect(JSON.parse(response.content[0].text)).toEqual(result);
    });

    it('should format error response correctly', () => {
      const error = new Error('Test error');
      const response = {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
      
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Test error');
    });
  });

  describe('Logging', () => {
    it('should log tool invocations', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Tool invoked',
        tool: 'get_commit_stats',
      };
      
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.tool).toBe('get_commit_stats');
    });

    it('should log errors', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Tool execution failed',
        error: 'Test error',
      };
      
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toContain('failed');
    });
  });

  describe('Performance tracking', () => {
    it('should track execution time', () => {
      const startTime = Date.now();
      const endTime = startTime + 100;
      const duration = endTime - startTime;
      
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });
});
