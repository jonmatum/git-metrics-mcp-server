# Git Metrics MCP Server

MCP server for analyzing git repository metrics and understanding team health. Built for Kiro CLI (Amazon Q CLI) and other MCP clients.

## Overview

This server provides tools to extract meaningful metrics from git repositories, helping teams understand their development patterns, identify risks early, and have better conversations about code quality and team health.

**This is a mirror, not a microscope.** Use it to reflect on team health and process quality, not to surveil individual behavior. See [INTENT.md](INTENT.md) for our philosophy on responsible metrics usage.

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

Then ask natural language questions:

```
Get commit stats for /home/user/myproject since 2025-11-01
Show me team summary and velocity trends for the last 2 weeks
What's our bus factor? Who are single points of failure?
Show me commit patterns - are people committing late at night?
What files have the most churn since October?
Identify technical debt and complexity hotspots
```

For comprehensive analysis, see the [Analysis Prompt](docs/git-metrics-analysis-prompt.md).

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

> **Note:** Hours are shown in the author's local timezone at the time of commit.

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

## Real-World Use Case: Team Health Analysis

Here's how a real engineering team used this tool to understand their development patterns across 5 repositories with 83 contributors:

### The Challenge
A team needed to understand their development health across multiple repositories without manually parsing git logs. They wanted to identify risks, improve collaboration, and ensure sustainable work practices.

### What They Discovered

**Team Health Insights:**
- ✅ Excellent work-life balance: Only 1.3% weekend commits
- ✅ Strong release discipline: 114 releases with 86.3% conventional commit adoption
- ⚠️ Bus factor risk: Two developers owned 61% of exclusive files in one repo
- ⚠️ High fix rate (36.3%) indicated reactive development in one project

**Collaboration Patterns:**
- Best practice: One repo had 88.9% shared files (excellent knowledge distribution)
- Needs improvement: Another repo had only 30.5% shared files
- Identified top collaboration pairs for knowledge sharing

**Code Quality Indicators:**
- Found complexity hotspots: Files with 66+ changes needing refactoring
- Identified technical debt: Stale files and high-churn areas
- Discovered optimal commit patterns: Median 17 lines (focused commits)

### Actions Taken
1. **Immediate:** Scheduled knowledge transfer sessions for high bus factor areas
2. **Process:** Implemented pair programming to increase file sharing
3. **Quality:** Added pre-commit hooks to reduce fix rate
4. **Culture:** Replicated best practices from high-performing repos

**Time Saved:** What would have taken days of manual analysis was completed in minutes with natural language queries.

**Read the full analysis:** [team-activity-analysis.md](team-activity-analysis.md)

---

## Use Cases

### ✅ Good Use Cases

**Sprint Retrospectives**
```
Show me team summary and velocity trends for the last 2 weeks
What's our commit pattern? Are we burning out?
```

**Risk Management**
```
What's our bus factor? Who are single points of failure?
Show me code ownership - where do we have knowledge concentration?
```

**Code Quality Reviews**
```
Show me quality metrics and technical debt
What files have high churn and need refactoring?
```

**Team Health Checks**
```
Are people committing late at night or on weekends?
Show me collaboration metrics - is the team working together?
```

**Onboarding Support**
```
Get commit stats for new-dev@example.com since their start date
Show their velocity trend over the first 3 months
```

### ❌ What This Is NOT For

- ❌ Micromanagement or surveillance
- ❌ Comparing developers against each other
- ❌ Performance review ammunition
- ❌ Daily productivity tracking

**See [INTENT.md](INTENT.md) for our philosophy on responsible metrics usage.**

## Team Health Indicators You Can Track

### Risk Management
- **Bus Factor**: Knowledge concentration risk - who are single points of failure?
- **Code Ownership**: File sharing patterns - is knowledge distributed?
- **Technical Debt**: Stale files, complexity hotspots needing attention

### Team Well-being
- **Burnout Indicators**: Weekend/late-night commits - is the team overworked?
- **Work Patterns**: When people commit - are boundaries healthy?
- **Velocity Trends**: Sustainable pace or sprint-and-crash cycles?

### Code Quality
- **Churn**: Files changed repeatedly (quality indicator)
- **Commit Size**: Focused commits vs. large dumps
- **Revert Rate**: How often do we undo work?
- **Fix Rate**: Reactive (high fixes) vs. proactive development

### Collaboration Health
- **File Sharing**: How much code is touched by multiple people?
- **Collaboration Pairs**: Who works together most often?
- **Contribution Balance**: Even distribution or bottlenecks?

### Process Maturity
- **Conventional Commits**: Adoption rate of commit standards
- **Release Frequency**: How often do we ship?
- **Breaking Changes**: How disruptive are our releases?

## Tips for Responsible Usage

### How to Use This Tool Well

1. **Use natural language**: Kiro understands context, so ask questions naturally
2. **Focus on trends, not snapshots**: Weekly/monthly patterns matter more than daily counts
3. **Combine metrics**: Ask for multiple analyses to get the full picture
4. **Start conversations, don't end them**: Use data to ask "why?" not to judge
5. **Look for patterns**: Team health indicators, not individual performance scores
6. **Regular reviews**: Weekly health checks (5 min), sprint retrospectives (15 min), monthly trends (30 min)

### Red Flags (Don't Do This)

- ❌ Checking metrics more than once per day
- ❌ Creating leaderboards or rankings
- ❌ Setting commit quotas or targets
- ❌ Using metrics in performance reviews without context
- ❌ Comparing developers directly

### Green Flags (Good Usage)

- ✅ You check trends weekly/monthly, not daily
- ✅ You ask "what does this tell us about our process?"
- ✅ You use it to start conversations, not end them
- ✅ You focus on team health, not individual performance
- ✅ You look for patterns, not outliers
- ✅ You use it to help, not judge

**Remember:** The best teams are built on trust, not metrics. Use this tool to support your team, not surveil them.

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
