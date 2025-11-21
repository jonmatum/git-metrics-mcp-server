#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const server = new Server(
  {
    name: "git-metrics-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function runGitCommand(repoPath: string, command: string): string {
  const fullPath = resolve(repoPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Repository path does not exist: ${fullPath}`);
  }
  return execSync(command, { cwd: fullPath, encoding: "utf-8" });
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments as any;

  if (request.params.name === "get_commit_stats") {
    const { repo_path, since, until, author } = args;
    let cmd = `git log --since="${since}"`;
    if (until) cmd += ` --until="${until}"`;
    if (author) cmd += ` --author="${author}"`;
    cmd += ` --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat`;

    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n");
    
    let commits = 0, additions = 0, deletions = 0, filesChanged = 0;
    
    for (const line of lines) {
      if (line.includes("|")) commits++;
      else if (line.match(/^\d+\s+\d+/)) {
        const [add, del] = line.split(/\s+/);
        additions += parseInt(add) || 0;
        deletions += parseInt(del) || 0;
        filesChanged++;
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          commits,
          additions,
          deletions,
          filesChanged,
          netChange: additions - deletions,
        }, null, 2),
      }],
    };
  }

  if (request.params.name === "get_author_metrics") {
    const { repo_path, since, until } = args;
    let cmd = `git log --since="${since}"`;
    if (until) cmd += ` --until="${until}"`;
    cmd += ` --pretty=format:"%an|%ae" --numstat`;

    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n");
    
    const authorStats: Record<string, { commits: number; additions: number; deletions: number; files: number }> = {};
    let currentAuthor = "";

    for (const line of lines) {
      if (line.includes("|")) {
        const [name, email] = line.split("|");
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

    return {
      content: [{ type: "text", text: JSON.stringify(authorStats, null, 2) }],
    };
  }

  if (request.params.name === "get_file_churn") {
    const { repo_path, since, limit = 10 } = args;
    const cmd = `git log --since="${since}" --name-only --pretty=format:`;
    
    const output = runGitCommand(repo_path, cmd);
    const files = output.trim().split("\n").filter(f => f);
    
    const fileCount: Record<string, number> = {};
    for (const file of files) {
      fileCount[file] = (fileCount[file] || 0) + 1;
    }

    const sorted = Object.entries(fileCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([file, changes]) => ({ file, changes }));

    return {
      content: [{ type: "text", text: JSON.stringify(sorted, null, 2) }],
    };
  }

  if (request.params.name === "get_team_summary") {
    const { repo_path, since, until } = args;
    
    // Get commit stats
    let statsCmd = `git log --since="${since}"`;
    if (until) statsCmd += ` --until="${until}"`;
    statsCmd += ` --pretty=format:"%an|%ae" --numstat`;

    const output = runGitCommand(repo_path, statsCmd);
    const lines = output.trim().split("\n");
    
    const authorStats: Record<string, any> = {};
    let currentAuthor = "";

    for (const line of lines) {
      if (line.includes("|")) {
        const [name, email] = line.split("|");
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

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          period: { since, until: until || "now" },
          team: {
            totalCommits,
            totalAdditions,
            totalDeletions,
            contributors: Object.keys(authorStats).length,
          },
          contributors: authorStats,
        }, null, 2),
      }],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Git Metrics MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
