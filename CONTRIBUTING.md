# Contributing to LumiPay

First off, thank you for considering contributing to LumiPay! It's people like you that make LumiPay such a great tool for decentralized commerce.

## How Can I Contribute?

### Reporting Bugs
This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.
- Use the provided GitHub Issue templates.
- Explain the behavior you expected and the actual behavior.
- Include screenshots or animated GIFs if possible.

### Suggesting Enhancements
This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.
- Use the provided feature request template.
- Provide a clear and descriptive title.
- Explain why this enhancement would be useful to most LumiPay users.

### Pull Requests
- Fork the repo and create your branch from `master`.
- If you've added code that should be tested, add tests.
- Ensure the test suite passes (`npm test` if available).
- Make sure your code lints (`npm run lint`).
- Format your code before committing (`npx prettier --write .`).
- Issue that pull request!

## Code Style
- We use Prettier for code formatting.
- Follow ESLint configurations provided in the repo.
- For Smart Contracts, adhere to standard Solidity styles and best practices.

## Development Setup
1. Clone the repository
2. Run `npm install`
3. Set up your `.env.local` based on the README.
4. Run `npm run dev` to start the Next.js server.
