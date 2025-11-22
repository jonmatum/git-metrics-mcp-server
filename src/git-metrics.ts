#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { existsSync, statSync } from "fs";
import { resolve } from "path";

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
    version: "1.1.0",
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

export function parseCommitData(output: string) {
  const lines = output.trim().split("\n");
  const commits: any[] = [];
  let current: any = null;

  for (const line of lines) {
    if (line.includes("|")) {
      if (current) commits.push(current);
      const parts = line.split("|");
      const hash = parts[0] || "";
      const author = parts[1] || "";
      const email = parts[2] || "";
      const date = parts[3] || "";
      const message = parts.slice(4).join("|") || "";
      current = { hash, author, email, date, message, files: [] };
    } else if (line.match(/^\d+\s+\d+/) && current) {
      const parts = line.split(/\s+/);
      const add = parts[0];
      const del = parts[1];
      const file = parts.slice(2).join(" ");
      current.files.push({ file, additions: parseInt(add) || 0, deletions: parseInt(del) || 0 });
    }
  }
  if (current) commits.push(current);
  return commits;
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const startTime = Date.now();
  const toolName = request.params.name;
  
  try {
    log('INFO', 'Tool invoked', { tool: toolName, args: request.params.arguments });
    
    const args = request.params.arguments as any;

  if (request.params.name === "get_commit_stats") {
    const { repo_path, since, until, author } = args;
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    if (until) validateDate(until, "until");
    
    let cmd = `git log --since="${since}"`;
    if (until) cmd += ` --until="${until}"`;
    if (author) cmd += ` --author="${author}"`;
    cmd += ` --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat`;

    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n").slice(0, 10000); // Limit to 10k lines
    
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
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    if (until) validateDate(until, "until");
    
    let cmd = `git log --since="${since}"`;
    if (until) cmd += ` --until="${until}"`;
    cmd += ` --pretty=format:"%an|%ae" --numstat`;

    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n").slice(0, 10000);
    
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
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    
    const cmd = `git log --since="${since}" --name-only --pretty=format:`;
    
    const output = runGitCommand(repo_path, cmd);
    const files = output.trim().split("\n").filter(f => f).slice(0, 10000);
    
    const fileCount: Record<string, number> = {};
    for (const file of files) {
      fileCount[file] = (fileCount[file] || 0) + 1;
    }

    const sorted = Object.entries(fileCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, Math.min(limit, 100)) // Max 100 files
      .map(([file, changes]) => ({ file, changes }));

    return {
      content: [{ type: "text", text: JSON.stringify(sorted, null, 2) }],
    };
  }

  if (request.params.name === "get_team_summary") {
    const { repo_path, since, until } = args;
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    if (until) validateDate(until, "until");
    
    let statsCmd = `git log --since="${since}"`;
    if (until) statsCmd += ` --until="${until}"`;
    statsCmd += ` --pretty=format:"%an|%ae" --numstat`;

    const output = runGitCommand(repo_path, statsCmd);
    const lines = output.trim().split("\n").slice(0, 10000);
    
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

  if (request.params.name === "get_commit_patterns") {
    const { repo_path, since, until } = args;
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    if (until) validateDate(until, "until");
    
    let cmd = `git log --since="${since}"`;
    if (until) cmd += ` --until="${until}"`;
    cmd += ` --pretty=format:"%ad" --date=format:"%u|%H"`;

    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n").slice(0, 10000);

    const byDay: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 };
    const byHour: Record<string, number> = {};
    
    for (const line of lines) {
      const [day, hour] = line.split("|");
      byDay[day] = (byDay[day] || 0) + 1;
      byHour[hour] = (byHour[hour] || 0) + 1;
    }

    const dayNames = { "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun" };
    const weekdayCommits = byDay["1"] + byDay["2"] + byDay["3"] + byDay["4"] + byDay["5"];
    const weekendCommits = byDay["6"] + byDay["7"];
    const lateNightCommits = Object.entries(byHour)
      .filter(([h]) => parseInt(h) >= 22 || parseInt(h) <= 5)
      .reduce((sum, [, count]) => sum + count, 0);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          byDay: Object.fromEntries(Object.entries(byDay).map(([k, v]) => [dayNames[k as keyof typeof dayNames], v])),
          byHour,
          patterns: {
            weekdayCommits,
            weekendCommits,
            weekendPercentage: ((weekendCommits / (weekdayCommits + weekendCommits)) * 100).toFixed(1) + "%",
            lateNightCommits,
            lateNightPercentage: ((lateNightCommits / lines.length) * 100).toFixed(1) + "%",
          },
        }, null, 2),
      }],
    };
  }

  if (request.params.name === "get_code_ownership") {
    const { repo_path, since } = args;
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    
    const cmd = `git log --since="${since}" --pretty=format:"%an|%ae" --name-only`;
    
    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n").slice(0, 10000);
    
    const fileAuthors: Record<string, Set<string>> = {};
    let currentAuthor = "";

    for (const line of lines) {
      if (line.includes("|")) {
        const [name, email] = line.split("|");
        currentAuthor = `${name} <${email}>`;
      } else if (line && currentAuthor) {
        if (!fileAuthors[line]) fileAuthors[line] = new Set();
        fileAuthors[line].add(currentAuthor);
      }
    }

    const authorFiles: Record<string, number> = {};
    const sharedFiles = Object.entries(fileAuthors).filter(([, authors]) => authors.size > 1).length;
    const soloFiles = Object.entries(fileAuthors).filter(([, authors]) => authors.size === 1).length;

    for (const [file, authors] of Object.entries(fileAuthors)) {
      for (const author of authors) {
        authorFiles[author] = (authorFiles[author] || 0) + 1;
      }
    }

    const busFactor = Object.entries(fileAuthors)
      .filter(([, authors]) => authors.size === 1)
      .reduce((acc, [file, authors]) => {
        const author = Array.from(authors)[0];
        acc[author] = (acc[author] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          totalFiles: Object.keys(fileAuthors).length,
          sharedFiles,
          soloFiles,
          filesPerAuthor: authorFiles,
          busFactor: Object.entries(busFactor)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([author, files]) => ({ author, exclusiveFiles: files })),
        }, null, 2),
      }],
    };
  }

  if (request.params.name === "get_velocity_trends") {
    const { repo_path, since, interval = "week" } = args;
    
    validateRepoPath(repo_path);
    validateDate(since, "since");
    
    const cmd = `git log --since="${since}" --pretty=format:"%ad|%H" --date=short --numstat`;
    
    const output = runGitCommand(repo_path, cmd);
    if (!output.trim()) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ interval, trends: [], message: "No commits found in this period" }, null, 2),
        }],
      };
    }

    const commits = parseCommitData(output);

    const periods: Record<string, { commits: number; additions: number; deletions: number }> = {};

    for (const commit of commits) {
      if (!commit.date || typeof commit.date !== 'string') continue;
      
      const date = new Date(commit.date);
      if (isNaN(date.getTime())) continue;
      
      let periodKey: string;
      
      if (interval === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split("T")[0];
      } else {
        periodKey = commit.date.substring(0, 7);
      }

      if (!periods[periodKey]) {
        periods[periodKey] = { commits: 0, additions: 0, deletions: 0 };
      }

      periods[periodKey].commits++;
      for (const file of commit.files) {
        periods[periodKey].additions += file.additions;
        periods[periodKey].deletions += file.deletions;
      }
    }

    const sorted = Object.entries(periods)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, stats]) => ({ period, ...stats }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ interval, trends: sorted }, null, 2),
      }],
    };
  }

  if (request.params.name === "get_collaboration_metrics") {
    const { repo_path, since } = args;
    const cmd = `git log --since="${since}" --pretty=format:"%an|%ae" --name-only`;
    
    const output = runGitCommand(repo_path, cmd);
    const lines = output.trim().split("\n");
    
    const fileAuthors: Record<string, Set<string>> = {};
    let currentAuthor = "";

    for (const line of lines) {
      if (line.includes("|")) {
        const [name, email] = line.split("|");
        currentAuthor = `${name} <${email}>`;
      } else if (line && currentAuthor) {
        if (!fileAuthors[line]) fileAuthors[line] = new Set();
        fileAuthors[line].add(currentAuthor);
      }
    }

    const collaborations: Record<string, number> = {};
    for (const [file, authors] of Object.entries(fileAuthors)) {
      if (authors.size > 1) {
        const authorList = Array.from(authors).sort();
        for (let i = 0; i < authorList.length; i++) {
          for (let j = i + 1; j < authorList.length; j++) {
            const pair = `${authorList[i]} <-> ${authorList[j]}`;
            collaborations[pair] = (collaborations[pair] || 0) + 1;
          }
        }
      }
    }

    const topCollaborations = Object.entries(collaborations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pair, sharedFiles]) => ({ pair, sharedFiles }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          collaborativeFiles: Object.values(fileAuthors).filter(a => a.size > 1).length,
          topCollaborations,
        }, null, 2),
      }],
    };
  }

  if (request.params.name === "get_quality_metrics") {
    const { repo_path, since } = args;
    const cmd = `git log --since="${since}" --pretty=format:"%H|%an|%ae|%ad|%s" --date=short --numstat`;
    
    const output = runGitCommand(repo_path, cmd);
    const commits = parseCommitData(output);

    let totalSize = 0;
    const commitSizes: number[] = [];
    let reverts = 0;
    let fixes = 0;

    for (const commit of commits) {
      const size = commit.files.reduce((sum: number, f: any) => sum + f.additions + f.deletions, 0);
      totalSize += size;
      commitSizes.push(size);
      
      if (commit.message.toLowerCase().includes("revert")) reverts++;
      if (commit.message.toLowerCase().match(/\b(fix|bug|hotfix)\b/)) fixes++;
    }

    const avgCommitSize = commits.length > 0 ? totalSize / commits.length : 0;
    commitSizes.sort((a, b) => a - b);
    const medianCommitSize = commitSizes[Math.floor(commitSizes.length / 2)] || 0;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          averageCommitSize: Math.round(avgCommitSize),
          medianCommitSize,
          totalReverts: reverts,
          revertRate: ((reverts / commits.length) * 100).toFixed(1) + "%",
          fixCommits: fixes,
          fixRate: ((fixes / commits.length) * 100).toFixed(1) + "%",
        }, null, 2),
      }],
    };
  }

  if (request.params.name === "get_technical_debt") {
    const { repo_path, stale_days = 90 } = args;
    
    const allFilesCmd = `git ls-files`;
    const allFiles = runGitCommand(repo_path, allFilesCmd).trim().split("\n");
    
    const staleFiles: any[] = [];
    const largeFiles: any[] = [];
    
    for (const file of allFiles) {
      if (!file) continue;
      
      try {
        const lastModCmd = `git log -1 --format="%ad" --date=short -- "${file}"`;
        const lastMod = runGitCommand(repo_path, lastModCmd).trim();
        
        if (lastMod) {
          const daysSince = Math.floor((Date.now() - new Date(lastMod).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince > stale_days) {
            staleFiles.push({ file, daysSinceLastChange: daysSince, lastModified: lastMod });
          }
        }

        const fullPath = resolve(repo_path, file);
        if (existsSync(fullPath)) {
          const stats = statSync(fullPath);
          if (stats.size > 10000) {
            const churnCmd = `git log --oneline -- "${file}" | wc -l`;
            const churn = parseInt(runGitCommand(repo_path, churnCmd).trim());
            largeFiles.push({ file, sizeBytes: stats.size, churn });
          }
        }
      } catch (e) {
        // Skip files that cause errors
      }
    }

    staleFiles.sort((a, b) => b.daysSinceLastChange - a.daysSinceLastChange);
    largeFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          staleFiles: staleFiles.slice(0, 20),
          largeFiles: largeFiles.slice(0, 20),
          complexityHotspots: largeFiles
            .filter(f => f.churn > 10)
            .sort((a, b) => (b.sizeBytes * b.churn) - (a.sizeBytes * a.churn))
            .slice(0, 10),
        }, null, 2),
      }],
    };
  }

  log('ERROR', 'Unknown tool', { tool: toolName });
  throw new Error(`Unknown tool: ${request.params.name}`);
  
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
    version: '1.1.0',
    timeout: GIT_TIMEOUT,
    maxBuffer: MAX_BUFFER
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log('ERROR', 'Server startup failed', { error: error.message });
    process.exit(1);
  });
}
