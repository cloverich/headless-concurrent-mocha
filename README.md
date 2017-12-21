# Headless chrome + mocha
This is a work in progress, proof of concept for:
- running mocha tests in chrome headless
- with webpack, react, typescript
- concurrently

## Status
- [x] Build typescript + react test files with webpack
- [x] support nested `__tests__` folders
- [x] run all tests in chrome headless
- [x] produce non-zero exit on test failure
- [x] use custom mocha reporter's to collect and report mocha test results
- [x] produce readable test output
- [x] run tests concurrently
- [ ] measure and report on memory usage
- [x] modularize and clean up code
- [x] `npm test` to run tests w/ ts-node
- [ ] provide useful notes and links in README
