# Git Metrics MCP Server

MCP server for analyzing git repository metrics and tracking team performance KPIs. Built for Kiro CLI (Amazon Q CLI) and other MCP clients.

## Overview

This server provides tools to extract meaningful metrics from git repositories, helping teams track productivity, code quality, and collaboration patterns.

## Features

- **Commit Statistics**: Track commits, additions, deletions, and files changed
- **Author Metrics**: Per-developer performance breakdown
- **File Churn Analysis**: Identify frequently modified files (quality indicators)
- **Team Summaries**: Comprehensive team performance reports

## Installation

### From npm (Recommended)

```bash
npm install -g @jonmatum/git-metrics-mcp-server
```

### From Source

```bash
git clone https://github.com/jonmatum/git-metrics-mcp-server.git
cd git-metrics-mcp-server
npm install
npm run build
```

## Kiro CLI Configuration

Add to `~/.kiro/settings/mcp.json`:

**If installed globally:**
```json
{
  "mcpServers": {
    "git-metrics": {
      "command": "git-metrics-mcp-server",
      "args": []
    }
  }
}
```

**If using npx:**
```json
{
  "mcpServers": {
    "git-metrics": {
      "command": "npx",
      "args": ["@jonmatum/git-metrics-mcp-server"]
    }
  }
}
```

**If running from source:**
```json
{
  "mcpServers": {
    "git-metrics": {
      "command": "npx",
      "args": ["tsx", "/path/to/git-metrics-mcp-server/src/git-metrics.ts"]
    }
  }
}
```

## Available Tools

### get_commit_stats

Get overall commit statistics for a time period.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD)
- `author` (optional): Filter by author

**Example:**
```
Get commit stats for /home/user/myproject since 2025-11-01
```

**Returns:**
```json
{
  "commits": 45,
  "additions": 1250,
  "deletions": 380,
  "filesChanged": 67,
  "netChange": 870
}
```

### get_author_metrics

Detailed metrics per contributor.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD)

**Returns:**
```json
{
  "John Doe <john@example.com>": {
    "commits": 23,
    "additions": 650,
    "deletions": 120,
    "files": 34
  }
}
```

### get_file_churn

Files with most changes (indicates complexity or issues).

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `limit` (optional): Number of files, default 10

**Returns:**
```json
[
  { "file": "src/main.ts", "changes": 15 },
  { "file": "src/utils.ts", "changes": 12 }
]
```

### get_team_summary

Comprehensive team performance report.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD)

**Returns:**
```json
{
  "period": { "since": "2025-11-01", "until": "now" },
  "team": {
    "totalCommits": 45,
    "totalAdditions": 1250,
    "totalDeletions": 380,
    "contributors": 3
  },
  "contributors": { ... }
}
```

## Example Queries

**Sprint Review:**
```
Generate a team summary for /home/user/project since 2025-11-01
```

**Individual Performance:**
```
Get commit stats for /home/user/project since 2025-11-01 for author john@example.com
```

**Code Quality Check:**
```
Show me file churn for /home/user/project since 2025-10-01 limit 20
```

**Weekly Standup:**
```
Get author metrics for /home/user/project since 2025-11-15
```

## Use Cases

- **Sprint Retrospectives**: Review team velocity and contribution patterns
- **Performance Reviews**: Data-driven developer assessments
- **Code Quality**: Identify problematic files with high churn
- **Team Balance**: Ensure even workload distribution
- **Onboarding**: Track new developer ramp-up

## KPIs You Can Track

- Commits per developer per week/sprint
- Code volume (lines added/deleted)
- File change frequency
- Code churn (quality indicator)
- Contribution balance across team
- Commit patterns and consistency

## Development

```bash
npm run dev    # Run in development mode
npm run build  # Build for production
npm start      # Run built version
```

## License

MIT - See [LICENSE](LICENSE) file

## Author

Jonatan Mata ([@jonmatum](https://github.com/jonmatum))

## Contributing

Issues and PRs welcome at https://github.com/jonmatum/git-metrics-mcp-server

## Support

- GitHub Issues: https://github.com/jonmatum/git-metrics-mcp-server/issues
- MCP Documentation: https://modelcontextprotocol.io/
