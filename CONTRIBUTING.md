# Contributing to Git Metrics MCP Server

## Development Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/jonmatum/git-metrics-mcp-server.git
   cd git-metrics-mcp-server
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Coverage thresholds are enforced at 80% for lines/functions/statements and 75% for branches.

## Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Ensure all tests pass: `npm test`
   - Follow existing code style (TypeScript strict mode)
   - Add structured logging for important operations

3. **Commit your changes**
   - Use conventional commits format:
     - `feat:` for new features
     - `fix:` for bug fixes
     - `docs:` for documentation
     - `test:` for test changes
     - `refactor:` for code refactoring
   
   Example: `feat: add new metric for code complexity`

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Open a Pull Request on GitHub
   - Describe your changes clearly
   - Link any related issues

## Code Guidelines

- Use TypeScript with strict mode
- Validate all user inputs
- Sanitize inputs to prevent command injection
- Add error handling with descriptive messages
- Use structured JSON logging: `log('INFO', 'message', { metadata })`
- Write tests for new features and bug fixes

## Project Structure

```
src/
├── git-metrics.ts    # Main server and core functions
├── handlers.ts       # Tool implementation handlers
└── *.test.ts        # Test files
```

## Questions?

Open an issue on GitHub or reach out to the maintainers.
