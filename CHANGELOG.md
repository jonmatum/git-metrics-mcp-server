# Changelog

## [5.0.2](https://github.com/jonmatum/git-metrics-mcp-server/compare/v5.0.1...v5.0.2) (2025-12-04)


### Bug Fixes

* resolve linting errors in test file ([8aefd5b](https://github.com/jonmatum/git-metrics-mcp-server/commit/8aefd5bbbf7e98d1bc72100a8df221d63c75049f))

## [5.0.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v5.0.0...v5.0.1) (2025-12-04)


### Bug Fixes

* resolve linting errors in test file ([8aefd5b](https://github.com/jonmatum/git-metrics-mcp-server/commit/8aefd5bbbf7e98d1bc72100a8df221d63c75049f))

## [5.0.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.4.1...v5.0.0) (2025-12-04)


### ⚠ BREAKING CHANGES

* git-metrics-analysis-prompt.md moved to docs/ directory

### Features

* **docs:** enhance MkDocs with dark mode, search, and feedback features ([31bfdfc](https://github.com/jonmatum/git-metrics-mcp-server/commit/31bfdfc9760fd4179972fe2abd59c24cbebb735b))


### Bug Fixes

* **security:** update MCP SDK to address DNS rebinding vulnerability ([df619e2](https://github.com/jonmatum/git-metrics-mcp-server/commit/df619e2da1a5a13c8c531132f6826d5ead95dc5e))


### Documentation

* add MkDocs documentation site and align with team health philosophy ([9178e69](https://github.com/jonmatum/git-metrics-mcp-server/commit/9178e69545e1af98d19e5bc633bd801eb33503e1))

## [4.4.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.4.0...v4.4.1) (2025-11-26)


### Bug Fixes

* lower coverage thresholds for CI environment compatibility ([25484ea](https://github.com/jonmatum/git-metrics-mcp-server/commit/25484eac652c1f29090a7d7a9374386b681d1f99))

## [4.4.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.3.1...v4.4.0) (2025-11-26)


### Features

* add production-ready features and 80%+ test coverage ([21d64e2](https://github.com/jonmatum/git-metrics-mcp-server/commit/21d64e2a136641899088f768a801809e782cbd3e))

## [4.3.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.3.0...v4.3.1) (2025-11-26)


### Bug Fixes

* **technical-debt:** sort stale files by age (oldest first) ([d3cc96e](https://github.com/jonmatum/git-metrics-mcp-server/commit/d3cc96e1a75e8608de627a305af18d440c19e1e7))

## [4.3.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.2.0...v4.3.0) (2025-11-26)


### Features

* **technical-debt:** add large files and average file age metrics ([38df1f7](https://github.com/jonmatum/git-metrics-mcp-server/commit/38df1f7aaa650befc466c39e7a3137ef0401c65a))

## [4.2.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.1.0...v4.2.0) (2025-11-26)


### Features

* **conventional-commits:** add total scope count to output ([c4b46f1](https://github.com/jonmatum/git-metrics-mcp-server/commit/c4b46f1c1b412127479b071f3455995d67cd6ed7))

## [4.1.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.0.1...v4.1.0) (2025-11-26)


### Features

* **conventional-commits:** add totalReleasesCount and remove release limit ([0c08bd3](https://github.com/jonmatum/git-metrics-mcp-server/commit/0c08bd350dfad815f95c5f445ee047f271a1d2ef))

## [4.0.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v4.0.0...v4.0.1) (2025-11-26)


### Bug Fixes

* **conventional-commits:** filter releases by date range ([592d38a](https://github.com/jonmatum/git-metrics-mcp-server/commit/592d38a09df0278274a49c8ad9d8c5a76f1cb0a3))

## [4.0.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v3.1.0...v4.0.0) (2025-11-25)


### ⚠ BREAKING CHANGES

* Reduces 80k+ git commands to 1 for large repos like Linux kernel

### Performance Improvements

* optimize for large repos by eliminating per-file git queries ([5415da6](https://github.com/jonmatum/git-metrics-mcp-server/commit/5415da6077f921d64c60ca17710e5ea3888a39df))

## [3.1.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v3.0.0...v3.1.0) (2025-11-25)


### Features

* add until parameter to all date-based tools ([4fde87b](https://github.com/jonmatum/git-metrics-mcp-server/commit/4fde87b808a36dfacbd731d54fc63b16d4c9fb10))

## [3.0.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v2.1.0...v3.0.0) (2025-11-25)


### ⚠ BREAKING CHANGES

* Date range behavior now includes commits on the until date. This aligns with user expectations but may change result counts for existing queries that relied on the exclusive behavior.

### Bug Fixes

* make until parameter inclusive by appending 23:59:59 ([c84a5b5](https://github.com/jonmatum/git-metrics-mcp-server/commit/c84a5b540922a246912e6372294682dbcbdd5b54))

## [2.1.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v2.0.1...v2.1.0) (2025-11-25)


### Features

* add conventional commits analysis tool ([d80b527](https://github.com/jonmatum/git-metrics-mcp-server/commit/d80b5272a2fc1c234b2e773d71060faf62bed467))


### Bug Fixes

* sync version from package.json and correct README documentation ([6491f93](https://github.com/jonmatum/git-metrics-mcp-server/commit/6491f93caf99b130c00cc9e245ba7922d13183a6))

## [2.0.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v2.0.0...v2.0.1) (2025-11-24)


### Bug Fixes

* remove incorrect ES module check preventing server startup ([b027a86](https://github.com/jonmatum/git-metrics-mcp-server/commit/b027a86688ee141ac8c01759476a3989a4708764))

## [2.0.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v1.2.2...v2.0.0) (2025-11-22)


### ⚠ BREAKING CHANGES

* Internal architecture refactored for better testability. All public APIs remain unchanged and fully backward compatible.

### Features

* improve test coverage to 80%+ with refactored architecture ([96d7e49](https://github.com/jonmatum/git-metrics-mcp-server/commit/96d7e490067600a4d6eccf8ba3c4678c224c7151))

## [1.2.2](https://github.com/jonmatum/git-metrics-mcp-server/compare/v1.2.1...v1.2.2) (2025-11-22)


### Bug Fixes

* handle pipe characters in commit messages ([d0701fd](https://github.com/jonmatum/git-metrics-mcp-server/commit/d0701fdbd617f978725697d6e4c0f2db2b83b95c))

## [1.2.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v1.2.0...v1.2.1) (2025-11-22)


### Bug Fixes

* extract commit message in parseCommitData to prevent undefined error ([a53c07e](https://github.com/jonmatum/git-metrics-mcp-server/commit/a53c07e0593391a5bd4c191c18ce9f9ee9e5deaf))

## [1.2.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v1.1.0...v1.2.0) (2025-11-21)


### Features

* add production-ready features and comprehensive test coverage ([e08d338](https://github.com/jonmatum/git-metrics-mcp-server/commit/e08d3385ddf0dd2238b26773bc5cd6fc4dfa07ea))

## [1.1.0](https://github.com/jonmatum/git-metrics-mcp-server/compare/v1.0.1...v1.1.0) (2025-11-21)


### Features

* add production-ready error handling and validation ([ced4223](https://github.com/jonmatum/git-metrics-mcp-server/commit/ced422312490bd739e8e99b6b984731f8b6978ea))

## [1.0.1](https://github.com/jonmatum/git-metrics-mcp-server/compare/v1.0.0...v1.0.1) (2025-11-21)


### Bug Fixes

* handle empty commits and invalid dates in velocity_trends ([359f7a2](https://github.com/jonmatum/git-metrics-mcp-server/commit/359f7a27b21a10c59cb40a8462b33cd37c814e13))

## 1.0.0 (2025-11-21)


### Features

* add comprehensive KPI tools ([9a96954](https://github.com/jonmatum/git-metrics-mcp-server/commit/9a96954b7cea4c5872f816e4747abf3f489fc960))
* initial release of git-metrics MCP server ([2e19711](https://github.com/jonmatum/git-metrics-mcp-server/commit/2e1971183cc5a1e797166decf56db4dd3a8d5421))
