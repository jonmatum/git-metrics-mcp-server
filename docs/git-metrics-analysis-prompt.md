# Git Metrics Analysis Prompt

Use this prompt with Kiro CLI to generate comprehensive team activity reports for any repository collection.

## Prompt

```
Use my git-metrics MCP server to analyze team health and development patterns across all repositories in this path.

IMPORTANT: This analysis is for team reflection, process improvement, and risk management—NOT individual performance evaluation. Focus on collaboration patterns, sustainable practices, and code quality trends.

Include:
- Team collaboration patterns and file sharing
- Bus factor and knowledge distribution risks
- Work-life balance indicators (weekend/late-night commits)
- Code quality trends (commit size, revert rate, fix rate)
- Velocity trends and sustainable pace
- Technical debt hotspots (stale files, high churn)
- Release discipline and conventional commit adoption
- Cross-team collaboration patterns

Generate a comprehensive markdown report with:
1. Executive summary highlighting team health
2. Repository-level insights on collaboration and quality
3. Risk identification (bus factor, technical debt)
4. Process improvement recommendations (not individual critiques)
5. Team health score and best practices to replicate

Frame all findings as conversation starters for team improvement, not as judgments of individual performance.

Analyze from 2024-01-01 to present.
```

## Usage

1. Navigate to the directory containing your repositories:
   ```bash
   cd /path/to/your/repos
   ```

2. Start Kiro CLI:
   ```bash
   kiro-cli chat
   ```

3. Paste the prompt above

4. The analysis will be saved as `team-activity-analysis.md` in the current directory

## Customization

To analyze a different time period, modify the prompt:
```
Analyze from YYYY-MM-DD to present.
```

To focus on specific repositories:
```
Focus the analysis on these repositories: repo1, repo2, repo3
```

To change the output filename, add:
```
Save the report as custom-report-name.md
```

## MCP Server Requirements

Ensure the git-metrics MCP server is configured in your Kiro CLI setup with these capabilities:
- get_team_summary
- get_code_ownership
- get_velocity_trends
- get_quality_metrics
- get_collaboration_metrics
- get_commit_patterns
- get_technical_debt
- get_file_churn
- get_conventional_commits
