# Git Metrics MCP Server

MCP server for analyzing git repository metrics and tracking team performance KPIs. Built for Kiro CLI (Amazon Q CLI) and other MCP clients.

## Overview

This server provides tools to extract meaningful metrics from git repositories, helping teams track productivity, code quality, and collaboration patterns.

## Features

- **Commit Statistics**: Track commits, additions, deletions, and files changed
- **Author Metrics**: Per-developer performance breakdown
- **File Churn Analysis**: Identify frequently modified files (quality indicators)
- **Team Summaries**: Comprehensive team performance reports
- **Commit Patterns**: Analyze when people commit (burnout detection)
- **Code Ownership**: Bus factor and knowledge distribution analysis
- **Velocity Trends**: Week/month productivity tracking
- **Collaboration Metrics**: Team interaction patterns
- **Quality Metrics**: Commit size, reverts, and fix rates
- **Technical Debt**: Stale files and complexity hotspots
- **Conventional Commits**: Analyze commit types, scopes, and release frequency

### Production Features

- **Input Sanitization**: Protection against command injection attacks
- **Structured Logging**: JSON-formatted logs with timestamps for monitoring
- **Configurable Timeouts**: Set `GIT_TIMEOUT` env var (default: 30s)
- **Error Boundaries**: Graceful error handling with detailed logging
- **CI/CD**: Automated testing on pull requests via GitHub Actions


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

## Usage with Kiro CLI

Start Kiro CLI:
```bash
kiro-cli chat
```

Then ask natural language questions about your repositories:

### Basic Metrics

**Get overall stats:**
```
Get commit stats for /home/user/myproject since 2025-11-01
```

**Team breakdown:**
```
Show me author metrics for this repo since last month
```

**Find problematic files:**
```
What files have the most churn in /home/user/myproject since October?
```

### Team Performance

**Sprint retrospective:**
```
Generate a team summary for /home/user/project since 2025-11-01
```

**Individual performance:**
```
Get commit stats for /home/user/project since 2025-11-01 for author john@example.com
```

**Velocity tracking:**
```
Show me velocity trends by week for this repo since November
```

### Code Quality & Health

**Burnout detection:**
```
Show me commit patterns for /home/user/project since last month
Are people committing late at night or on weekends?
```

**Quality indicators:**
```
What are the quality metrics for this repo since last sprint?
How many reverts and fixes do we have?
```

**Technical debt:**
```
Identify technical debt in /home/user/project
Show me stale files and complexity hotspots
```

### Team Collaboration

**Bus factor analysis:**
```
What's our bus factor for /home/user/project?
Who owns critical code areas?
```

**Collaboration patterns:**
```
Show me collaboration metrics for this repo
Who works together most often?
```

### Advanced Queries

**Compare time periods:**
```
Compare velocity trends for this repo: last month vs this month
```

**Multi-metric analysis:**
```
Analyze /home/user/project: show me quality metrics, technical debt, and bus factor
```

**Custom date ranges:**
```
Get team summary for /home/user/project from 2025-10-01 to 2025-10-31
```

## Available Tools

> **Note on Date Ranges**: The `until` parameter is **inclusive** - commits on the end date are included in results. For example, `since="2025-11-01" until="2025-11-30"` includes all commits from November 1st through November 30th.

### get_commit_stats

Get overall commit statistics for a time period.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD), inclusive
- `author` (optional): Filter by author

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
- `until` (optional): End date (YYYY-MM-DD), inclusive
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

### get_commit_patterns

Analyze when people commit (burnout detection).

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD)

**Returns:**
```json
{
  "byDay": { "Mon": 45, "Tue": 38, ... },
  "byHour": { "09": 12, "14": 18, ... },
  "patterns": {
    "weekendPercentage": "15.2%",
    "lateNightPercentage": "8.3%"
  }
}
```

### get_code_ownership

Bus factor and knowledge distribution.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD), inclusive

**Returns:**
```json
{
  "totalFiles": 150,
  "sharedFiles": 80,
  "soloFiles": 70,
  "busFactor": [
    { "author": "John <john@example.com>", "exclusiveFiles": 25 }
  ]
}
```

### get_velocity_trends

Track velocity over time.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD), inclusive
- `interval` (optional): "week" or "month", default "week"

**Returns:**
```json
{
  "interval": "week",
  "trends": [
    { "period": "2025-11-01", "commits": 45, "additions": 1250, "deletions": 380 }
  ]
}
```

### get_collaboration_metrics

Team interaction patterns.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD), inclusive

**Returns:**
```json
{
  "collaborativeFiles": 80,
  "topCollaborations": [
    { "pair": "John <-> Jane", "sharedFiles": 25 }
  ]
}
```

### get_quality_metrics

Code quality indicators.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD), inclusive

**Returns:**
```json
{
  "averageCommitSize": 125,
  "medianCommitSize": 85,
  "revertRate": "2.3%",
  "fixRate": "18.5%"
}
```

### get_technical_debt

Identify technical debt.

**Parameters:**
- `repo_path` (required): Path to git repository
- `stale_days` (optional): Days to consider stale, default 90

**Returns:**
```json
{
  "staleFiles": [
    { "file": "old-module.js", "daysSinceLastChange": 180 }
  ],
  "complexityHotspots": [
    { "file": "big-file.js", "churn": 25 }
  ]
}
```

### get_conventional_commits

Analyze conventional commit usage and release patterns.

**Parameters:**
- `repo_path` (required): Path to git repository
- `since` (required): Start date (YYYY-MM-DD)
- `until` (optional): End date (YYYY-MM-DD), inclusive

**Returns:**
```json
{
  "totalCommits": 25,
  "conventionalCommits": 25,
  "conventionalPercentage": "100.0%",
  "commitTypes": [
    { "type": "feat", "count": 5 },
    { "type": "fix", "count": 5 }
  ],
  "topScopes": [
    { "scope": "main", "count": 8 }
  ],
  "breakingChanges": 0,
  "recentReleases": [
    { "tag": "v2.0.1", "date": "2025-11-24" }
  ],
  "releaseFrequency": "8 releases since 2025-11-01"
}
```

## Use Cases

### Sprint Retrospectives
```
Show me team summary and velocity trends for the last 2 weeks
What's our commit pattern? Are we burning out?
```

### Performance Reviews
```
Get author metrics for john@example.com since last quarter
Compare their velocity to team average
```

### Code Quality Reviews
```
Show me quality metrics and technical debt
What files have high churn and need refactoring?
```

### Team Health Checks
```
What's our bus factor? Who are single points of failure?
Show me collaboration metrics - is the team working together?
```

### Onboarding Tracking
```
Get commit stats for new-dev@example.com since their start date
Show their velocity trend over the first 3 months
```

## KPIs You Can Track

- **Velocity**: Commits per developer per week/sprint
- **Code Volume**: Lines added/deleted
- **Activity**: Files changed
- **Churn**: Files changed repeatedly (quality indicator)
- **Contribution Balance**: Even distribution across team
- **Commit Frequency**: Daily/weekly patterns
- **Burnout Indicators**: Weekend/late-night commits
- **Bus Factor**: Knowledge concentration risk
- **Collaboration**: Team interaction frequency
- **Quality**: Commit size, revert rate, fix rate
- **Technical Debt**: Stale files, large files, complexity

## Tips for Best Results

1. **Use natural language**: Kiro understands context, so ask questions naturally
2. **Combine metrics**: Ask for multiple analyses in one query
3. **Compare periods**: Track trends over time
4. **Be specific with dates**: Use "since 2025-11-01" or "last month"
5. **Filter by author**: Focus on individual or team performance
6. **Regular reviews**: Run weekly/monthly to track trends

## Development

```bash
npm run dev    # Run in development mode
npm run build  # Build for production
npm start      # Run built version
```

## Testing

```bash
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

The test suite covers:
- Date validation
- Repository path validation
- Git command execution
- Commit data parsing
- Core git operations (stats, metrics, churn, velocity)


## License

MIT - See [LICENSE](LICENSE) file

## Author

Jonatan Mata ([@jonmatum](https://github.com/jonmatum))

## Contributing

Issues and PRs welcome at https://github.com/jonmatum/git-metrics-mcp-server

## Support

- GitHub Issues: https://github.com/jonmatum/git-metrics-mcp-server/issues
- MCP Documentation: https://modelcontextprotocol.io/
