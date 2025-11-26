import { runGitCommand, validateRepoPath, validateDate } from './git-metrics.js';

export function handleGetCommitStats(args: any) {
  const { repo_path, since, until, author } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  if (author) cmd += ` --author="${author}"`;
  cmd += ` --pretty=format:"%H" --shortstat`;

  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  let commits = 0, additions = 0, deletions = 0, filesChanged = 0;
  
  for (const line of lines) {
    if (line.match(/^[0-9a-f]{40}$/)) {
      commits++;
    } else if (line.includes("changed")) {
      const addMatch = line.match(/(\d+) insertion/);
      const delMatch = line.match(/(\d+) deletion/);
      const fileMatch = line.match(/(\d+) file/);
      if (addMatch) additions += parseInt(addMatch[1]);
      if (delMatch) deletions += parseInt(delMatch[1]);
      if (fileMatch) filesChanged += parseInt(fileMatch[1]);
    }
  }

  return {
    commits,
    additions,
    deletions,
    filesChanged,
    netChange: additions - deletions,
  };
}

export function handleGetAuthorMetrics(args: any) {
  const { repo_path, since, until } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%an <%ae>" --numstat`;

  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  const authors: Record<string, any> = {};
  let currentAuthor = "";
  
  for (const line of lines) {
    if (line.includes("<") && line.includes(">")) {
      currentAuthor = line;
      if (!authors[currentAuthor]) {
        authors[currentAuthor] = { commits: 0, additions: 0, deletions: 0, files: 0 };
      }
      authors[currentAuthor].commits++;
    } else if (line.match(/^\d+\s+\d+/) && currentAuthor) {
      const [add, del] = line.split(/\s+/);
      authors[currentAuthor].additions += parseInt(add) || 0;
      authors[currentAuthor].deletions += parseInt(del) || 0;
      authors[currentAuthor].files++;
    }
  }
  
  return authors;
}

export function handleGetFileChurn(args: any) {
  const { repo_path, since, until, limit = 10 } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --name-only --pretty=format:`;
  const output = runGitCommand(repo_path, cmd);
  
  const fileChanges: Record<string, number> = {};
  const lines = output.trim().split("\n");
  
  for (const line of lines) {
    if (line.trim()) {
      fileChanges[line] = (fileChanges[line] || 0) + 1;
    }
  }
  
  return Object.entries(fileChanges)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([file, changes]) => ({ file, changes }));
}

export function handleGetTeamSummary(args: any) {
  const { repo_path, since, until } = args;
  
  const stats = handleGetCommitStats({ repo_path, since, until });
  const authors = handleGetAuthorMetrics({ repo_path, since, until });
  
  return {
    period: { since, until: until || "now" },
    team: {
      totalCommits: stats.commits,
      totalAdditions: stats.additions,
      totalDeletions: stats.deletions,
      contributors: Object.keys(authors).length,
    },
    contributors: authors,
  };
}

export function handleGetCommitPatterns(args: any) {
  const { repo_path, since, until } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%ad" --date=format:"%u %H"`;

  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  const byDay: Record<string, number> = {};
  const byHour: Record<string, number> = {};
  let weekendCommits = 0, lateNightCommits = 0;
  
  for (const line of lines) {
    const [day, hour] = line.split(" ");
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayName = dayNames[parseInt(day) - 1];
    
    byDay[dayName] = (byDay[dayName] || 0) + 1;
    byHour[hour] = (byHour[hour] || 0) + 1;
    
    if (parseInt(day) >= 6) weekendCommits++;
    if (parseInt(hour) >= 22 || parseInt(hour) <= 6) lateNightCommits++;
  }
  
  return {
    byDay,
    byHour,
    patterns: {
      weekendPercentage: `${((weekendCommits / lines.length) * 100).toFixed(1)}%`,
      lateNightPercentage: `${((lateNightCommits / lines.length) * 100).toFixed(1)}%`,
    },
  };
}

export function handleGetCodeOwnership(args: any) {
  const { repo_path, since, until } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%an <%ae>" --name-only`;
  
  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  const fileAuthors: Record<string, Set<string>> = {};
  let currentAuthor = "";
  
  for (const line of lines) {
    if (line.includes("<") && line.includes(">")) {
      currentAuthor = line;
    } else if (line.trim() && currentAuthor) {
      if (!fileAuthors[line]) fileAuthors[line] = new Set();
      fileAuthors[line].add(currentAuthor);
    }
  }
  
  const authorFiles: Record<string, number> = {};
  for (const [file, authors] of Object.entries(fileAuthors)) {
    if (authors.size === 1) {
      const author = Array.from(authors)[0];
      authorFiles[author] = (authorFiles[author] || 0) + 1;
    }
  }
  
  return {
    totalFiles: Object.keys(fileAuthors).length,
    sharedFiles: Object.values(fileAuthors).filter(a => a.size > 1).length,
    soloFiles: Object.values(fileAuthors).filter(a => a.size === 1).length,
    busFactor: Object.entries(authorFiles)
      .sort(([, a], [, b]) => b - a)
      .map(([author, exclusiveFiles]) => ({ author, exclusiveFiles })),
  };
}

export function handleGetVelocityTrends(args: any) {
  const { repo_path, since, until, interval = "week" } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  const format = interval === "month" ? "%Y-%m" : "%Y-%W";
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%ad|%H" --date=format:"${format}" --numstat`;
  
  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  const periods: Record<string, any> = {};
  let currentPeriod = "";
  
  for (const line of lines) {
    if (line.includes("|")) {
      currentPeriod = line.split("|")[0];
      if (!periods[currentPeriod]) {
        periods[currentPeriod] = { commits: 0, additions: 0, deletions: 0 };
      }
      periods[currentPeriod].commits++;
    } else if (line.match(/^\d+\s+\d+/) && currentPeriod) {
      const [add, del] = line.split(/\s+/);
      periods[currentPeriod].additions += parseInt(add) || 0;
      periods[currentPeriod].deletions += parseInt(del) || 0;
    }
  }
  
  return {
    interval,
    trends: Object.entries(periods).map(([period, data]) => ({ period, ...data })),
  };
}

export function handleGetCollaborationMetrics(args: any) {
  const { repo_path, since, until } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%an <%ae>" --name-only`;
  
  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  const fileAuthors: Record<string, Set<string>> = {};
  let currentAuthor = "";
  
  for (const line of lines) {
    if (line.includes("<") && line.includes(">")) {
      currentAuthor = line;
    } else if (line.trim() && currentAuthor) {
      if (!fileAuthors[line]) fileAuthors[line] = new Set();
      fileAuthors[line].add(currentAuthor);
    }
  }
  
  const collaborations: Record<string, number> = {};
  for (const authors of Object.values(fileAuthors)) {
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
  
  return {
    collaborativeFiles: Object.values(fileAuthors).filter(a => a.size > 1).length,
    topCollaborations: Object.entries(collaborations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pair, sharedFiles]) => ({ pair, sharedFiles })),
  };
}

export function handleGetQualityMetrics(args: any) {
  const { repo_path, since, until } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%H|%s" --numstat`;
  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n");
  
  const commitSizes: number[] = [];
  let currentSize = 0;
  let reverts = 0, fixes = 0, totalCommits = 0;
  
  for (const line of lines) {
    if (line.includes("|")) {
      if (currentSize > 0) commitSizes.push(currentSize);
      currentSize = 0;
      totalCommits++;
      const msg = line.split("|")[1].toLowerCase();
      if (msg.includes("revert")) reverts++;
      if (msg.includes("fix")) fixes++;
    } else if (line.match(/^\d+\s+\d+/)) {
      const [add, del] = line.split(/\s+/);
      currentSize += (parseInt(add) || 0) + (parseInt(del) || 0);
    }
  }
  
  const avg = commitSizes.reduce((a, b) => a + b, 0) / commitSizes.length || 0;
  const sorted = commitSizes.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 0;
  
  return {
    averageCommitSize: Math.round(avg),
    medianCommitSize: median,
    revertRate: `${((reverts / totalCommits) * 100).toFixed(1)}%`,
    fixRate: `${((fixes / totalCommits) * 100).toFixed(1)}%`,
  };
}

export function handleGetTechnicalDebt(args: any) {
  const { repo_path, stale_days = 90 } = args;
  
  validateRepoPath(repo_path);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - stale_days);
  const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);
  
  const staleCmd = `git ls-files -z | xargs -0 -n1 -I{} sh -c 'echo "{}|$(git log -1 --format=%ct -- "{}")"' | awk -F'|' '$2 < ${cutoffTimestamp} {print $1"|"$2}'`;
  const churnCmd = `git log --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20`;
  
  let staleFiles: any[] = [];
  try {
    const staleOutput = runGitCommand(repo_path, staleCmd);
    const now = Math.floor(Date.now() / 1000);
    staleFiles = staleOutput.trim().split("\n")
      .filter(l => l)
      .map(line => {
        const [file, timestamp] = line.split("|");
        const days = Math.floor((now - parseInt(timestamp)) / 86400);
        return { file, daysSinceLastChange: days };
      })
      .sort((a, b) => b.daysSinceLastChange - a.daysSinceLastChange)
      .slice(0, 10);
  } catch {
    // Fallback to simpler approach
    const filesCmd = `git ls-files | head -100`;
    const files = runGitCommand(repo_path, filesCmd).trim().split("\n");
    
    for (const file of files) {
      try {
        const lastChangeCmd = `git log -1 --format=%ct -- "${file}"`;
        const timestamp = parseInt(runGitCommand(repo_path, lastChangeCmd).trim());
        const days = Math.floor((Date.now() / 1000 - timestamp) / 86400);
        if (days > stale_days) {
          staleFiles.push({ file, daysSinceLastChange: days });
        }
      } catch {}
    }
    staleFiles = staleFiles.sort((a, b) => b.daysSinceLastChange - a.daysSinceLastChange).slice(0, 10);
  }
  
  let complexityHotspots: any[] = [];
  try {
    const churnOutput = runGitCommand(repo_path, churnCmd);
    complexityHotspots = churnOutput.trim().split("\n")
      .filter(l => l.trim())
      .map(line => {
        const match = line.trim().match(/^\s*(\d+)\s+(.+)$/);
        if (match) {
          return { file: match[2], changes: parseInt(match[1]) };
        }
        return null;
      })
      .filter(x => x !== null)
      .slice(0, 10);
  } catch {}
  
  // Get large files (>500 lines)
  let largeFiles: any[] = [];
  try {
    const filesCmd = `git ls-files`;
    const files = runGitCommand(repo_path, filesCmd).trim().split("\n").filter(f => f);
    
    for (const file of files.slice(0, 100)) {
      try {
        const linesCmd = `wc -l "${file}"`;
        const output = runGitCommand(repo_path, linesCmd).trim();
        const lines = parseInt(output.split(/\s+/)[0]);
        if (lines > 500) {
          largeFiles.push({ file, lines });
        }
      } catch {}
    }
    largeFiles = largeFiles.sort((a, b) => b.lines - a.lines).slice(0, 10);
  } catch {}
  
  // Calculate average file age
  let averageFileAge = null;
  try {
    const filesCmd = `git ls-files`;
    const files = runGitCommand(repo_path, filesCmd).trim().split("\n").filter(f => f);
    const now = Math.floor(Date.now() / 1000);
    let totalAge = 0;
    let count = 0;
    
    for (const file of files.slice(0, 100)) {
      try {
        const lastChangeCmd = `git log -1 --format=%ct -- "${file}"`;
        const timestamp = parseInt(runGitCommand(repo_path, lastChangeCmd).trim());
        const days = Math.floor((now - timestamp) / 86400);
        totalAge += days;
        count++;
      } catch {}
    }
    
    if (count > 0) {
      averageFileAge = Math.round(totalAge / count);
    }
  } catch {}
  
  return {
    staleFiles,
    largeFiles,
    complexityHotspots,
    averageFileAge,
  };
}

export function handleGetConventionalCommits(args: any) {
  const { repo_path, since, until } = args;
  
  validateRepoPath(repo_path);
  validateDate(since, "since");
  if (until) validateDate(until, "until");
  
  let cmd = `git log --since="${since}"`;
  if (until) cmd += ` --until="${until} 23:59:59"`;
  cmd += ` --pretty=format:"%H|%s|%ad" --date=short`;
  const output = runGitCommand(repo_path, cmd);
  const lines = output.trim().split("\n").filter(l => l);
  
  const types: Record<string, number> = {};
  const scopes: Record<string, number> = {};
  let breaking = 0;
  let conventional = 0;
  
  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(([^)]+)\))?(!)?:/;
  
  for (const line of lines) {
    const [hash, message, date] = line.split("|");
    const match = message.match(conventionalRegex);
    
    if (match) {
      conventional++;
      const [, type, , scope, isBreaking] = match;
      types[type] = (types[type] || 0) + 1;
      if (scope) scopes[scope] = (scopes[scope] || 0) + 1;
      if (isBreaking || message.includes("BREAKING CHANGE")) breaking++;
    }
  }
  
  const tagsCmd = `git tag --sort=-creatordate --format="%(refname:short)|%(creatordate:short)"`;
  const tagsOutput = runGitCommand(repo_path, tagsCmd);
  const tags = tagsOutput.trim().split("\n").filter(t => t);
  
  const releases = tags
    .map(t => {
      const [tag, date] = t.split("|");
      return { tag, date };
    })
    .filter(r => {
      const releaseDate = new Date(r.date);
      const sinceDate = new Date(since);
      const untilDate = until ? new Date(until) : new Date();
      return releaseDate >= sinceDate && releaseDate <= untilDate;
    });
  
  const sortedScopes = Object.entries(scopes).sort(([,a], [,b]) => b - a);
  
  return {
    totalCommits: lines.length,
    conventionalCommits: conventional,
    conventionalPercentage: `${((conventional / lines.length) * 100).toFixed(1)}%`,
    commitTypes: Object.entries(types).sort(([,a], [,b]) => b - a).map(([type, count]) => ({ type, count })),
    topScopes: sortedScopes.slice(0, 10).map(([scope, count]) => ({ scope, count })),
    totalScopeCount: sortedScopes.length,
    breakingChanges: breaking,
    recentReleases: releases,
    totalReleasesCount: releases.length,
    releaseFrequency: releases.length > 1 ? `${releases.length} releases since ${since}` : "No releases found"
  };
}
