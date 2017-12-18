
// export function setupMocha() {
//   mocha.setup({ reporter: MyReporter, ui: 'bdd' })
// }

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

  // https://github.com/mochajs/mocha/wiki/Third-party-reporters
  function MyReporter(runner) {
    const report = {
      stats: {
        // Possibly, test file name, total duration?

      },
      events: []
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
    });

    runner.on('fail', function (test, err) {
      report.events.push({
        type: 'test',
        value: formatTest(test, err),
      });
    });

    runner.on('end', () => {
      window.__MOCHA_RESULT__ = report;
      console.log('TEST_OUTPUT', JSON.stringify(report));
    });

  }

  mocha.setup({ reporter: MyReporter, ui: 'bdd' });
}
