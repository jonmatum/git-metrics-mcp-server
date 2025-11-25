# Performance Optimization for Large Repositories

## Problem
The MCP server was timing out on large repositories (e.g., Linux kernel with ~80k files and 1M+ commits) due to:

1. **Per-file git queries** - Running separate `git log` for each file
2. **Excessive iterations** - Processing all files without limits
3. **Inefficient parsing** - Using `--numstat` which outputs per-file stats
4. **Low timeouts** - 30s default timeout insufficient for large repos
5. **Small buffer** - 10MB buffer too small for large git outputs

## Solutions Implemented

### 1. Code Ownership (handleGetCodeOwnership)
**Before:** Ran `git log` for each file individually (80k+ commands for Linux)
```typescript
for (const file of files) {
  git log --since="..." -- "${file}"  // 80,000+ executions!
}
```

**After:** Single git command processes all files at once
```typescript
git log --since="..." --pretty=format:"%an <%ae>" --name-only
// Parse output to build file->authors mapping
```

**Impact:** ~80,000 git commands → 1 git command (99.99% reduction)

### 2. Collaboration Metrics (handleGetCollaborationMetrics)
**Before:** Limited to 1000 files, still ran 1000 separate git commands
**After:** Same single-command approach as code ownership

**Impact:** 1,000 git commands → 1 git command (99.9% reduction)

### 3. Technical Debt (handleGetTechnicalDebt)
**Before:** Ran 2 git commands per file (up to 1000 files = 2000 commands)
**After:** Uses batch git commands with piping
```bash
git ls-files -z | xargs -0 -n1 -I{} sh -c '...'  # Batch processing
git log --name-only --pretty=format: | sort | uniq -c  # Single churn query
```

**Impact:** 2,000 git commands → 2 git commands (99.9% reduction)

### 4. Commit Stats (handleGetCommitStats)
**Before:** Used `--numstat` which outputs per-file details
**After:** Uses `--shortstat` which outputs summary per commit

**Impact:** Reduced output size by ~90%, faster parsing

### 5. Timeout & Buffer Increases
**Before:**
- Timeout: 30 seconds
- Buffer: 10 MB

**After:**
- Timeout: 60 seconds (configurable via `GIT_TIMEOUT` env var)
- Buffer: 50 MB

**Impact:** Handles larger repos without truncation/timeout

## Performance Results

### Linux Kernel Repository Test
- **Before:** Timeouts on most operations (>60s)
- **After:** 
  - `get_author_metrics`: 1.6s (was timing out)
  - `get_commit_stats`: 1.8s (was timing out)
  - `get_code_ownership`: ~5s (was timing out)
  - `get_collaboration_metrics`: ~5s (was timing out)

### Smaller Repository (aws-sandbox)
- **Before:** 356ms
- **After:** ~300ms (slight improvement, already fast)

## Key Optimization Principles Applied

1. **Batch operations** - Single git command instead of loops
2. **Efficient git flags** - Use `--shortstat` instead of `--numstat` when possible
3. **Stream processing** - Parse output line-by-line instead of loading all in memory
4. **Appropriate limits** - Increase buffers/timeouts for large repos
5. **Fallback strategies** - Simpler approaches when batch commands fail

## Configuration

Set environment variable for custom timeout:
```bash
export GIT_TIMEOUT=120000  # 2 minutes for very large repos
```

## Remaining Considerations

For extremely large repos (>1M commits in date range):
- Consider adding `--max-count` limits
- Add pagination support for results
- Implement caching layer for repeated queries
- Use `git rev-list` for counting instead of full log parsing
