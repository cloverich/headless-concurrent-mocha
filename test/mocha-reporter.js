
exports.runMocha = function runMocha() {
  mocha.run();
}

exports.createMochaReporter = function createMochaReporter() {
  function formatError(err) {
    if (!err) return {};

    let res = {};
    Object.getOwnPropertyNames(err).forEach(key => res[key] = err[key]);
    console.log('formatted error: ', res, 'actual', err)
    return res;
  }

  function formatTest(test, err) {
    return {
      title: test.title,
      status: err == null ? 'pass' : 'fail',
      suite: test.titlePath().slice(0, -1),
      duration: test.duration,
      err: formatError(err)
    };
  }

  /**
   * Instead of streaming test output to the console (or stdout) as it comes,
   * this reporter collects output and stores it on window.__TEST_RESULT__,
   * where it can be picked up by the node process.
   *
   * https://github.com/mochajs/mocha/wiki/Third-party-reporters
   * https://github.com/direct-adv-interfaces/mocha-headless-chrome
   * @param {Mocha.runner} runner
   */
  function CollectingReporter(runner) {
    const report = {
      stats: {
        passes: 0,
        fails: 0,
      },
      // Collect all mocha events as they happen, so we can replay them in local-reporter
      events: [],
      failedTests: [],
    }

    runner.on('suite', function (suite) {
      report.events.push({
        type: 'suite_start',
        value: suite.titlePath(),
      });
    });

    runner.on('suite end', function (suite) {
      report.events.push({
        type: 'suite_end',
        value: suite.titlePath(),
      });
    });

    runner.on('pass', function (test) {
      report.events.push({
        type: 'test',
        value: formatTest(test, null),
      });

      report.stats.passes++;
    });

    runner.on('fail', function (test, err) {
      const formatted = formatTest(test, err);

      report.events.push({
        type: 'test',
        value: formatted,
      });

      report.failedTests.push(formatted);
      report.stats.fails++;
    });

    runner.on('end', () => {
      window.__TEST_RESULT__ = report;
    });
  }

  mocha.setup({ reporter: CollectingReporter, ui: 'bdd' });
}
