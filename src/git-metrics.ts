#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { existsSync, statSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as handlers from "./handlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

function log(level: 'INFO' | 'ERROR' | 'WARN', message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...meta };
  console.error(JSON.stringify(logEntry));
}

const GIT_TIMEOUT = parseInt(process.env.GIT_TIMEOUT || '30000');
const MAX_BUFFER = 10 * 1024 * 1024;

const server = new Server(
  {
    name: "git-metrics-mcp-server",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

export function runGitCommand(repoPath: string, command: string): string {
  const fullPath = resolve(repoPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Repository path does not exist: ${fullPath}`);
  }
  try {
    return execSync(command, { 
      cwd: fullPath, 
      encoding: "utf-8",
      timeout: GIT_TIMEOUT,
      maxBuffer: MAX_BUFFER
    });
  } catch (error: any) {
    log('ERROR', 'Git command failed', { command, error: error.message });
    throw new Error(`Git command failed: ${error.message}`);
  }
}

export function sanitizeInput(input: string): string {
  return input.replace(/[;&|`$()]/g, '');
}

export function validateDate(date: string, fieldName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid ${fieldName} format. Use YYYY-MM-DD (e.g., 2025-11-21)`);
  }
}

export function validateRepoPath(repoPath: string): void {
  if (!repoPath || typeof repoPath !== 'string') {
    throw new Error('repo_path is required and must be a string');
  }
  if (/[;&|`$()]/.test(repoPath)) {
    throw new Error('Invalid characters in repo_path');
  }
  const fullPath = resolve(repoPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Repository path does not exist: ${fullPath}`);
  }
  const gitPath = resolve(fullPath, '.git');
  if (!existsSync(gitPath)) {
    throw new Error(`Not a git repository: ${fullPath}`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_commit_stats",
      description: "Get commit statistics for a repository",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
          until: { type: "string", description: "End date (YYYY-MM-DD), optional" },
          author: { type: "string", description: "Filter by author email/name, optional" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_author_metrics",
      description: "Get detailed metrics per author",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
          until: { type: "string", description: "End date (YYYY-MM-DD), optional" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_file_churn",
      description: "Get files with most changes (churn)",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
          limit: { type: "number", description: "Number of files to return, default 10" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_team_summary",
      description: "Get comprehensive team performance summary",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
          until: { type: "string", description: "End date (YYYY-MM-DD), optional" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_commit_patterns",
      description: "Analyze commit frequency patterns by day and hour",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
          until: { type: "string", description: "End date (YYYY-MM-DD), optional" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_code_ownership",
      description: "Analyze code ownership and bus factor",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_velocity_trends",
      description: "Track velocity trends over time",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
          interval: { type: "string", description: "week or month, default week" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_collaboration_metrics",
      description: "Analyze team collaboration patterns",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_quality_metrics",
      description: "Code quality indicators (commit size, reverts, etc)",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
        },
        required: ["repo_path", "since"],
      },
    },
    {
      name: "get_technical_debt",
      description: "Identify technical debt indicators",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          stale_days: { type: "number", description: "Days without changes to consider stale, default 90" },
        },
        required: ["repo_path"],
      },
    },
    {
      name: "get_conventional_commits",
      description: "Analyze conventional commit usage and release patterns",
      inputSchema: {
        type: "object",
        properties: {
          repo_path: { type: "string", description: "Path to git repository" },
          since: { type: "string", description: "Start date (YYYY-MM-DD)" },
        },
        required: ["repo_path", "since"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  const toolName = request.params.name;
  
  try {
    log('INFO', 'Tool invoked', { tool: toolName, args: request.params.arguments });
    
    const args = request.params.arguments as any;
    let result: any;

    if (request.params.name === "get_commit_stats") {
      result = handlers.handleGetCommitStats(args);
    } else if (request.params.name === "get_author_metrics") {
      result = handlers.handleGetAuthorMetrics(args);
    } else if (request.params.name === "get_file_churn") {
      result = handlers.handleGetFileChurn(args);
    } else if (request.params.name === "get_team_summary") {
      result = handlers.handleGetTeamSummary(args);
    } else if (request.params.name === "get_commit_patterns") {
      result = handlers.handleGetCommitPatterns(args);
    } else if (request.params.name === "get_code_ownership") {
      result = handlers.handleGetCodeOwnership(args);
    } else if (request.params.name === "get_velocity_trends") {
      result = handlers.handleGetVelocityTrends(args);
    } else if (request.params.name === "get_collaboration_metrics") {
      result = handlers.handleGetCollaborationMetrics(args);
    } else if (request.params.name === "get_quality_metrics") {
      result = handlers.handleGetQualityMetrics(args);
    } else if (request.params.name === "get_technical_debt") {
      result = handlers.handleGetTechnicalDebt(args);
    } else if (request.params.name === "get_conventional_commits") {
      result = handlers.handleGetConventionalCommits(args);
    } else {
      log('ERROR', 'Unknown tool', { tool: toolName });
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const duration = Date.now() - startTime;
    log('INFO', 'Tool completed', { tool: toolName, duration });

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2),
      }],
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log('ERROR', 'Tool execution failed', { 
      tool: toolName, 
      error: error.message, 
      duration 
    });
    throw error;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('INFO', 'Git Metrics MCP Server started', { 
    version: VERSION,
    timeout: GIT_TIMEOUT,
    maxBuffer: MAX_BUFFER
  });
}

main().catch((error) => {
  log('ERROR', 'Server startup failed', { error: error.message });
  process.exit(1);
});
