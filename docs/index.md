# Git Metrics MCP Server

MCP server for analyzing git repository metrics and understanding team health.

## Quick Start

### Installation

```bash
npm install -g @jonmatum/git-metrics-mcp-server
```

### Kiro CLI Configuration

Add to `~/.kiro/settings/mcp.json`:

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

### Usage

```bash
kiro-cli chat
```

Ask natural language questions:
```
Get commit stats for /home/user/myproject since 2025-11-01
Show me team summary for the last 2 weeks
What's our bus factor?
```

## Documentation

- **[Philosophy](intent.md)** - Responsible usage guidelines
- **[Analysis Prompt](git-metrics-analysis-prompt.md)** - Copy-paste prompt for comprehensive analysis

## Features

- Commit statistics and author metrics
- File churn analysis
- Team collaboration patterns
- Burnout detection (commit patterns)
- Bus factor analysis
- Velocity trends
- Quality metrics
- Technical debt identification
- Conventional commits analysis
