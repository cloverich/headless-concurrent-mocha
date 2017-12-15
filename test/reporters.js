const chalk = require('chalk');

exports.reportFails = (fails) => {
  if (!fails.length) return;

  console.log('\n', chalk.red(fails.length, 'tests failed.\n'));
  fails.forEach((test, idx) => {
    console.log(`  ${idx + 1}) ${test.title}:`, chalk.red(test.err.message));
    console.log('    Actual:', chalk.cyan(test.err.actual));
    console.log('\n', chalk.dim(test.err.stack), '\n');
  });
}


const isWin32 = process.platform === 'win32';

// Adapted from mocha/lib/base.js
const symbols = {
  ok: isWin32 ? '\u221A' : '✓',
  err: isWin32 ? '\u00D7' : '✖',
};


exports.reportTests = (testFilename, report) => {
  let currentSuite = [];
  const fails = [];

  // console.log('\n', chalk.cyan(`Reporting test: ${testFilename}`), '\n');

  report.events.forEach(event => {
    switch (event.type) {
      case 'suite_start':
        currentSuite = event.value;

        // Mocha passes up [] for first suite; don't print it.
        if (!currentSuite.length) return;

        console.log(
          // Indent one level for each suite
          currentSuite.map(i => '  ').join(''),
          event.value[event.value.length - 1],
        );
        break;
      case 'suite_end':
        currentSuite.pop();
        break;
      case 'test':
        console.log(
          // Indent one level deeper than the Suite
          [1].concat(currentSuite).map(i => '  ').join(''),
          event.value.status === 'pass' ? chalk.green(symbols.ok) : chalk.red(symbols.err),
          chalk.dim(event.value.title),
        );

        if (event.value.status === 'fail') fails.push(event.value);

        break;
      default:
        throw new Error("Unexpected event type from report: ", event.type);
    }
  })

  return fails;
}
