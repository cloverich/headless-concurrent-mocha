# Headless chrome + mocha
This is a work in progress, proof of concept for:
- running mocha tests in chrome headless
- with webpack, react, typescript
- concurrently

The end goal is to be merely an example of how one might set-it up, with links and instructions for anyone wanting help or wishing to take (a fork of) it further.

- [x] webpack test build
- [x] dynamically generate entry and test.html files
- [x] run all tests in chrome headless
- [x] non-zero exit on test failure
- [x] produce clean reporting output
- [x] support nested `__tests__` folders
- [x] maintain nested `__tests__` structure in output
- [x] run tests concurrently
- [x] use webpack stats to figure out which files to run
- [x] generate html from a single template, and [inject scripts][1]
- [ ] obtain test report without console.log logic
- [ ] measure and report on memory usage
- [ ] print test epilogue
- [ ] modularize and clean up code
- [x] `npm test` to run tests w/ ts-node
- [ ] provide useful notes and links in README


[1]: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageaddscripttagoptions